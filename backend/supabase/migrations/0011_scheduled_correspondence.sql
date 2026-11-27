-- Pass 17B: scheduled correspondence with server-enforced opening times.
alter table public.correspondence_messages
  add column if not exists available_at timestamptz not null default now();
alter table public.correspondence_invitations
  add column if not exists available_at timestamptz not null default now();

create index if not exists correspondence_messages_available_at_idx
  on public.correspondence_messages(thread_id,available_at,created_at);

drop policy if exists messages_select_thread_member on public.correspondence_messages;
create policy messages_select_available_thread_member
  on public.correspondence_messages for select to authenticated
  using (
    exists (
      select 1 from public.correspondence_participants cp
      where cp.thread_id=correspondence_messages.thread_id
        and cp.profile_id=(select auth.uid())
    )
    and (sender_id=(select auth.uid()) or available_at<=now())
  );

revoke insert on public.correspondence_messages from authenticated;
grant insert (thread_id,sender_id,snapshot) on public.correspondence_messages to authenticated;

drop policy if exists lumie_private_read_owner_or_recipient on storage.objects;
create policy lumie_private_read_owner_or_recipient on storage.objects
for select to authenticated
using (
  bucket_id='lumie-private'
  and exists (
    select 1 from public.assets a
    where a.object_key=name and a.status='ready'
      and (
        a.owner_id=(select auth.uid())
        or exists (
          select 1
          from public.asset_thread_grants g
          join public.correspondence_participants cp on cp.thread_id=g.thread_id
          join public.correspondence_messages m on m.thread_id=g.thread_id
          where g.asset_id=a.id
            and cp.profile_id=(select auth.uid())
            and m.available_at<=now()
            and m.snapshot->'document'->'elements' @> jsonb_build_array(jsonb_build_object('imageAssetId',a.id::text))
        )
      )
  )
);

create or replace function public.lumie_send_correspondence_scheduled(
  p_sender_id uuid,
  p_recipient_email text,
  p_creation_id uuid,
  p_available_at timestamptz default null
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
  v_available_at timestamptz := coalesce(p_available_at,now());
  v_asset_id uuid;
begin
  if current_setting('request.jwt.claim.role',true) is distinct from 'service_role' then
    raise exception 'Not authorised' using errcode = '42501';
  end if;
  if p_available_at is not null and (p_available_at < now() or p_available_at > now() + interval '5 years') then
    return jsonb_build_object('error','INVALID_DELIVERY_TIME');
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
  values(p_sender_id,case when v_available_at>now() then 'A letter is waiting' else v_creation.title end)
  returning * into v_thread;
  insert into public.correspondence_participants(thread_id,profile_id,role)
  values(v_thread.id,p_sender_id,'sender'),(v_thread.id,v_recipient.id,'recipient');
  insert into public.correspondence_messages(thread_id,sender_id,creation_id,creation_revision,snapshot,available_at)
  values(v_thread.id,p_sender_id,v_creation.id,v_creation.revision,
    jsonb_build_object('title',v_creation.title,'format',v_creation.format,'document',v_creation.document_json),
    v_available_at);
  insert into public.asset_thread_grants(asset_id,thread_id,granted_by)
  select distinct (element->>'imageAssetId')::uuid,v_thread.id,p_sender_id
  from jsonb_array_elements(coalesce(v_creation.document_json->'elements','[]'::jsonb)) element
  where element ? 'imageAssetId'
    and (element->>'imageAssetId') ~* '^[0-9a-f-]{36}$'
  on conflict do nothing;
  return jsonb_build_object(
    'threadId',v_thread.id,
    'subject',case when v_available_at>now() then v_creation.title else v_thread.subject end,
    'recipientName',coalesce(v_recipient.display_name,'Lumie member'),
    'availableAt',v_available_at
  );
end;
$$;
revoke all on function public.lumie_send_correspondence_scheduled(uuid,text,uuid,timestamptz) from public,anon,authenticated;
grant execute on function public.lumie_send_correspondence_scheduled(uuid,text,uuid,timestamptz) to service_role;

create or replace function public.lumie_accept_correspondence_invitation(
  p_token_hash text,
  p_recipient_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invite public.correspondence_invitations;
  v_recipient public.profiles;
  v_sender public.profiles;
  v_thread public.correspondence_threads;
  v_asset_id uuid;
begin
  if current_setting('request.jwt.claim.role',true) is distinct from 'service_role' then
    raise exception 'Not authorised' using errcode = '42501';
  end if;
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' or p_recipient_id is null then
    return jsonb_build_object('error','INVITATION_NOT_FOUND');
  end if;
  select * into v_invite from public.correspondence_invitations where token_hash=p_token_hash for update;
  if not found then return jsonb_build_object('error','INVITATION_NOT_FOUND'); end if;
  if v_invite.status='accepted' then
    if v_invite.accepted_by=p_recipient_id and v_invite.thread_id is not null then
      return jsonb_build_object('threadId',v_invite.thread_id,'alreadyAccepted',true);
    end if;
    return jsonb_build_object('error','INVITATION_ALREADY_USED');
  end if;
  if v_invite.status <> 'pending' then return jsonb_build_object('error','INVITATION_NOT_AVAILABLE'); end if;
  if v_invite.expires_at <= now() then
    update public.correspondence_invitations set status='expired' where id=v_invite.id;
    return jsonb_build_object('error','INVITATION_EXPIRED');
  end if;
  select * into v_recipient from public.profiles where id=p_recipient_id;
  if not found or lower(coalesce(v_recipient.email,'')) <> v_invite.recipient_email
     or p_recipient_id=v_invite.sender_id then
    return jsonb_build_object('error','INVITATION_EMAIL_MISMATCH');
  end if;
  select * into v_sender from public.profiles where id=v_invite.sender_id;
  if not found then return jsonb_build_object('error','INVITATION_NOT_AVAILABLE'); end if;
  for v_asset_id in
    select distinct (element->>'imageAssetId')::uuid
    from jsonb_array_elements(coalesce(v_invite.snapshot->'document'->'elements','[]'::jsonb)) element
    where element ? 'imageAssetId' and (element->>'imageAssetId') ~* '^[0-9a-f-]{36}$'
  loop
    if not exists(select 1 from public.assets where id=v_asset_id and owner_id=v_invite.sender_id and status='ready') then
      return jsonb_build_object('error','ASSET_UNAVAILABLE');
    end if;
  end loop;
  insert into public.correspondence_threads(created_by,subject)
  values(v_invite.sender_id,case when v_invite.available_at>now() then 'A letter is waiting' else coalesce(nullif(v_invite.snapshot->>'title',''),'A letter for you') end)
  returning * into v_thread;
  insert into public.correspondence_participants(thread_id,profile_id,role)
  values(v_thread.id,v_invite.sender_id,'sender'),(v_thread.id,p_recipient_id,'recipient');
  insert into public.correspondence_messages(thread_id,sender_id,creation_id,creation_revision,snapshot,available_at)
  values(v_thread.id,v_invite.sender_id,v_invite.creation_id,v_invite.creation_revision,v_invite.snapshot,v_invite.available_at);
  insert into public.asset_thread_grants(asset_id,thread_id,granted_by)
  select distinct (element->>'imageAssetId')::uuid,v_thread.id,v_invite.sender_id
  from jsonb_array_elements(coalesce(v_invite.snapshot->'document'->'elements','[]'::jsonb)) element
  where element ? 'imageAssetId'
    and (element->>'imageAssetId') ~* '^[0-9a-f-]{36}$'
  on conflict do nothing;
  update public.correspondence_invitations
  set status='accepted',accepted_by=p_recipient_id,accepted_at=now(),thread_id=v_thread.id
  where id=v_invite.id;
  return jsonb_build_object(
    'threadId',v_thread.id,'subject',case when v_invite.available_at>now() then coalesce(nullif(v_invite.snapshot->>'title',''),'A letter for you') else v_thread.subject end,
    'senderName',coalesce(v_sender.display_name,'Lumie member'),'availableAt',v_invite.available_at
  );
end;
$$;
revoke all on function public.lumie_accept_correspondence_invitation(text,uuid) from public,anon,authenticated;
grant execute on function public.lumie_accept_correspondence_invitation(text,uuid) to service_role;
