-- Pass 16D: keep user-callable RPCs SECURITY INVOKER.
-- Triggers preserve revision and correspondence invariants without exposing
-- SECURITY DEFINER RPCs through the public Data API.

create or replace function public.guard_creation_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.id is distinct from old.id or new.owner_id is distinct from old.owner_id then
    raise exception 'Creation ownership is immutable' using errcode = '42501';
  end if;
  if old.status = 'archived' then
    raise exception 'Archived creations cannot be changed' using errcode = '42501';
  end if;
  if new.status is distinct from old.status
     and not (old.status = 'draft' and new.status = 'archived') then
    raise exception 'Invalid creation status transition' using errcode = '42501';
  end if;
  if new.title is distinct from old.title
     or new.format is distinct from old.format
     or new.document_json is distinct from old.document_json then
    new.revision := old.revision + 1;
    new.updated_at := now();
  else
    new.revision := old.revision;
  end if;
  if new.status = 'archived' then
    new.archived_at := coalesce(new.archived_at, now());
  else
    new.archived_at := null;
  end if;
  return new;
end;
$$;
revoke all on function public.guard_creation_mutation() from public, anon, authenticated;

create or replace function public.record_creation_revision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.revision is distinct from old.revision then
    insert into public.creation_revisions(creation_id,owner_id,revision,document_json)
    values(new.id,new.owner_id,new.revision,new.document_json);
  end if;
  return new;
end;
$$;
revoke all on function public.record_creation_revision() from public, anon, authenticated;

drop trigger if exists creations_guard_mutation on public.creations;
create trigger creations_guard_mutation
before update on public.creations
for each row execute function public.guard_creation_mutation();

drop trigger if exists creations_record_revision on public.creations;
create trigger creations_record_revision
after insert or update on public.creations
for each row execute function public.record_creation_revision();

create or replace function public.bump_thread_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.correspondence_threads
  set last_message_at = new.created_at
  where id = new.thread_id;
  return new;
end;
$$;
revoke all on function public.bump_thread_activity() from public, anon, authenticated;

drop trigger if exists correspondence_message_bump_activity on public.correspondence_messages;
create trigger correspondence_message_bump_activity
after insert on public.correspondence_messages
for each row execute function public.bump_thread_activity();

-- User writes are limited to content fields. Revision numbers and snapshots are
-- produced by the trigger, while ownership and status are enforced by RLS/triggers.
grant insert (owner_id,title,format,document_json) on public.creations to authenticated;
grant update (title,format,document_json,status,archived_at) on public.creations to authenticated;
grant insert on public.correspondence_messages to authenticated;

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
  set title=trim(p_title),format=p_format,document_json=p_document
  where id=p_creation_id and owner_id=v_user_id and revision=p_expected_revision and status='draft'
  returning * into v_row;
  if not found then
    if exists(select 1 from public.creations where id=p_creation_id and owner_id=v_user_id) then
      return jsonb_build_object('conflict',true);
    end if;
    return null;
  end if;
  return jsonb_build_object(
    'id',v_row.id,'title',v_row.title,'format',v_row.format,'document_json',v_row.document_json,
    'revision',v_row.revision,'status',v_row.status,'created_at',v_row.created_at,'updated_at',v_row.updated_at
  );
end;
$$;

create or replace function public.lumie_archive_creation(p_creation_id uuid)
returns boolean
language plpgsql
security invoker
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
  if not exists(
    select 1 from public.correspondence_participants
    where thread_id=p_thread_id and profile_id=v_user_id
  ) then
    return null;
  end if;
  insert into public.correspondence_messages(thread_id,sender_id,snapshot)
  values(p_thread_id,v_user_id,p_snapshot)
  returning * into v_message;
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
