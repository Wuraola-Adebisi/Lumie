-- Pass 16B: production runtime permissions and transactional operations.
-- Keep email private to the owning profile and trusted service-side correspondence lookup.
alter table public.profiles add column if not exists email text;
create unique index if not exists profiles_email_lower_idx
  on public.profiles (lower(email)) where email is not null;

create or replace function public.sync_lumie_profile_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles(id, display_name, email)
  values (
    new.id,
    left(trim(coalesce(new.raw_user_meta_data ->> 'display_name','')),80),
    lower(nullif(trim(new.email),''))
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;
revoke all on function public.sync_lumie_profile_identity() from public, anon, authenticated;
drop trigger if exists on_auth_user_created_lumie on auth.users;
create trigger on_auth_user_created_lumie
after insert or update of email on auth.users
for each row execute function public.sync_lumie_profile_identity();

-- Remove Supabase's broad default table grants. RLS remains the row-level boundary.
revoke all privileges on all tables in schema public from anon, authenticated;
grant usage on schema public to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update on public.creations to authenticated;
grant select, insert on public.creation_revisions to authenticated;
grant select, insert on public.assets to authenticated;
grant select, update on public.correspondence_threads to authenticated;
grant select, update on public.correspondence_participants to authenticated;
grant select, insert on public.correspondence_messages to authenticated;
grant select on public.asset_thread_grants to authenticated;

-- Keep immutable records immutable even if table-level defaults change later.
revoke update, delete on public.creation_revisions from anon, authenticated;
revoke update, delete on public.correspondence_messages from anon, authenticated;
revoke delete on public.creations, public.assets, public.correspondence_threads,
  public.correspondence_participants, public.asset_thread_grants from anon, authenticated;

create or replace function public.lumie_create_creation(
  p_title text,
  p_format text,
  p_document jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_row public.creations;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if p_title is null or length(trim(p_title)) not between 1 and 80
     or p_format not in ('letter','postcard','photo-card','collage','memory')
     or jsonb_typeof(p_document) <> 'object' then
    raise exception 'Invalid creation' using errcode = '22023';
  end if;
  insert into public.creations(owner_id,title,format,document_json)
  values(v_user_id,trim(p_title),p_format,p_document)
  returning * into v_row;
  insert into public.creation_revisions(creation_id,owner_id,revision,document_json)
  values(v_row.id,v_user_id,1,p_document);
  return jsonb_build_object(
    'id',v_row.id,'title',v_row.title,'format',v_row.format,'document_json',v_row.document_json,
    'revision',v_row.revision,'status',v_row.status,'created_at',v_row.created_at,'updated_at',v_row.updated_at
  );
end;
$$;

create or replace function public.lumie_update_creation(
  p_creation_id uuid,
  p_title text,
  p_format text,
  p_document jsonb,
  p_expected_revision integer
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_row public.creations;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if p_title is null or length(trim(p_title)) not between 1 and 80
     or p_format not in ('letter','postcard','photo-card','collage','memory')
     or jsonb_typeof(p_document) <> 'object'
     or p_expected_revision < 1 then
    raise exception 'Invalid creation' using errcode = '22023';
  end if;
  update public.creations
  set title=trim(p_title),format=p_format,document_json=p_document,revision=revision+1
  where id=p_creation_id and owner_id=v_user_id and revision=p_expected_revision and status='draft'
  returning * into v_row;
  if not found then
    if exists(select 1 from public.creations where id=p_creation_id and owner_id=v_user_id) then
      return jsonb_build_object('conflict',true);
    end if;
    return null;
  end if;
  insert into public.creation_revisions(creation_id,owner_id,revision,document_json)
  values(v_row.id,v_user_id,v_row.revision,p_document);
  return jsonb_build_object(
    'id',v_row.id,'title',v_row.title,'format',v_row.format,'document_json',v_row.document_json,
    'revision',v_row.revision,'status',v_row.status,'created_at',v_row.created_at,'updated_at',v_row.updated_at
  );
end;
$$;

create or replace function public.lumie_reply_to_correspondence(
  p_thread_id uuid,
  p_snapshot jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_message public.correspondence_messages;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if jsonb_typeof(p_snapshot) <> 'object' then
    raise exception 'Invalid reply' using errcode = '22023';
  end if;
  if not exists(select 1 from public.correspondence_participants where thread_id=p_thread_id and profile_id=v_user_id) then
    return null;
  end if;
  insert into public.correspondence_messages(thread_id,sender_id,snapshot)
  values(p_thread_id,v_user_id,p_snapshot)
  returning * into v_message;
  update public.correspondence_threads set last_message_at=now() where id=p_thread_id;
  return jsonb_build_object('id',v_message.id,'sent_at',v_message.created_at);
end;
$$;

-- This function is only callable by the Edge Function's service-role client.
-- It performs the complete send in one database transaction.
create or replace function public.lumie_send_correspondence(
  p_sender_id uuid,
  p_recipient_email text,
  p_creation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_recipient public.profiles;
  v_creation public.creations;
  v_thread public.correspondence_threads;
  v_asset_id uuid;
begin
  if current_setting('request.jwt.claim.role',true) is distinct from 'service_role' then
    raise exception 'Not authorised' using errcode = '42501';
  end if;
  select * into v_recipient from public.profiles
  where lower(email)=lower(trim(p_recipient_email));
  if not found then return jsonb_build_object('error','RECIPIENT_NOT_FOUND'); end if;
  if v_recipient.id=p_sender_id then return jsonb_build_object('error','SELF_SEND'); end if;
  select * into v_creation from public.creations
  where id=p_creation_id and owner_id=p_sender_id and status='draft'
  for update;
  if not found then return jsonb_build_object('error','CREATION_NOT_FOUND'); end if;
  for v_asset_id in
    select distinct (element->>'imageAssetId')::uuid
    from jsonb_array_elements(coalesce(v_creation.document_json->'elements','[]'::jsonb)) element
    where element ? 'imageAssetId' and (element->>'imageAssetId') ~* '^[0-9a-f-]{36}$'
  loop
    if not exists(select 1 from public.assets where id=v_asset_id and owner_id=p_sender_id and status='ready') then
      return jsonb_build_object('error','ASSET_UNAVAILABLE');
    end if;
  end loop;
  insert into public.correspondence_threads(created_by,subject)
  values(p_sender_id,v_creation.title) returning * into v_thread;
  insert into public.correspondence_participants(thread_id,profile_id,role)
  values(v_thread.id,p_sender_id,'sender'),(v_thread.id,v_recipient.id,'recipient');
  insert into public.correspondence_messages(thread_id,sender_id,creation_id,creation_revision,snapshot)
  values(v_thread.id,p_sender_id,v_creation.id,v_creation.revision,
    jsonb_build_object('title',v_creation.title,'format',v_creation.format,'document',v_creation.document_json));
  insert into public.asset_thread_grants(asset_id,thread_id,granted_by)
  select distinct (element->>'imageAssetId')::uuid,v_thread.id,p_sender_id
  from jsonb_array_elements(coalesce(v_creation.document_json->'elements','[]'::jsonb)) element
  where element ? 'imageAssetId'
    and (element->>'imageAssetId') ~* '^[0-9a-f-]{36}$'
  on conflict do nothing;
  return jsonb_build_object('threadId',v_thread.id,'subject',v_thread.subject,'recipientName',coalesce(v_recipient.display_name,'Lumie member'));
end;
$$;

revoke all on function public.lumie_create_creation(text,text,jsonb) from public, anon;
revoke all on function public.lumie_update_creation(uuid,text,text,jsonb,integer) from public, anon;
revoke all on function public.lumie_reply_to_correspondence(uuid,jsonb) from public, anon;
revoke all on function public.lumie_send_correspondence(uuid,text,uuid) from public, anon, authenticated;
grant execute on function public.lumie_create_creation(text,text,jsonb) to authenticated;
grant execute on function public.lumie_update_creation(uuid,text,text,jsonb,integer) to authenticated;
grant execute on function public.lumie_reply_to_correspondence(uuid,jsonb) to authenticated;
grant execute on function public.lumie_send_correspondence(uuid,text,uuid) to service_role;
