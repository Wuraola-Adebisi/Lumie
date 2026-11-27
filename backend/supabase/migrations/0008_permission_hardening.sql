-- Pass 16C: narrow direct table privileges and move state transitions behind trusted RPCs.
-- Authenticated clients may read their own records, but cannot rewrite ownership,
-- lifecycle fields, immutable history, or identity email through the Data API.

revoke insert, update on public.creations from authenticated;
revoke insert on public.creation_revisions from authenticated;
revoke update on public.profiles from authenticated;
grant update (display_name, avatar_asset_id, locale, time_zone)
  on public.profiles to authenticated;
revoke update on public.correspondence_threads from authenticated;
revoke update on public.correspondence_participants from authenticated;
revoke insert on public.correspondence_messages from authenticated;
revoke insert on public.assets from authenticated;
grant insert (id, owner_id, object_key, original_file_name, content_type, size_bytes)
  on public.assets to authenticated;

create or replace function public.lumie_create_creation(
  p_title text,
  p_format text,
  p_document jsonb
)
returns jsonb
language plpgsql
security definer
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
security definer
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

create or replace function public.lumie_archive_creation(p_creation_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  update public.creations
  set status='archived', archived_at=now()
  where id=p_creation_id and owner_id=v_user_id and status='draft';
  return found;
end;
$$;

create or replace function public.lumie_reply_to_correspondence(
  p_thread_id uuid,
  p_snapshot jsonb
)
returns jsonb
language plpgsql
security definer
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
  if not exists(
    select 1 from public.correspondence_participants
    where thread_id=p_thread_id and profile_id=v_user_id
  ) then
    return null;
  end if;
  insert into public.correspondence_messages(thread_id,sender_id,snapshot)
  values(p_thread_id,v_user_id,p_snapshot)
  returning * into v_message;
  update public.correspondence_threads set last_message_at=now() where id=p_thread_id;
  return jsonb_build_object('id',v_message.id,'sent_at',v_message.created_at);
end;
$$;

revoke all on function public.lumie_create_creation(text,text,jsonb) from public, anon;
revoke all on function public.lumie_update_creation(uuid,text,text,jsonb,integer) from public, anon;
revoke all on function public.lumie_archive_creation(uuid) from public, anon;
revoke all on function public.lumie_reply_to_correspondence(uuid,jsonb) from public, anon;
grant execute on function public.lumie_create_creation(text,text,jsonb) to authenticated;
grant execute on function public.lumie_update_creation(uuid,text,text,jsonb,integer) to authenticated;
grant execute on function public.lumie_archive_creation(uuid) to authenticated;
grant execute on function public.lumie_reply_to_correspondence(uuid,jsonb) to authenticated;
