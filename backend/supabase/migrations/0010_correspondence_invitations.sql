-- Pass 17A: secure one-time invitations for correspondence recipients without accounts.
create table public.correspondence_invitations (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_email text not null check (recipient_email = lower(trim(recipient_email))),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  creation_id uuid not null references public.creations(id) on delete restrict,
  creation_revision integer not null check (creation_revision > 0),
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  status text not null default 'pending' check (status in ('pending','accepted','revoked','expired')),
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_by uuid references public.profiles(id) on delete set null,
  accepted_at timestamptz,
  thread_id uuid references public.correspondence_threads(id) on delete set null,
  created_at timestamptz not null default now()
);

create index correspondence_invitations_sender_status_idx
  on public.correspondence_invitations(sender_id,status,created_at desc);
create index correspondence_invitations_expiry_idx
  on public.correspondence_invitations(expires_at) where status='pending';

alter table public.correspondence_invitations enable row level security;
revoke all on public.correspondence_invitations from anon, authenticated;
grant select on public.correspondence_invitations to authenticated;
create policy correspondence_invitations_read_sender
  on public.correspondence_invitations for select to authenticated
  using (sender_id = auth.uid());

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

  select * into v_invite
  from public.correspondence_invitations
  where token_hash=p_token_hash
  for update;
  if not found then return jsonb_build_object('error','INVITATION_NOT_FOUND'); end if;

  if v_invite.status='accepted' then
    if v_invite.accepted_by=p_recipient_id and v_invite.thread_id is not null then
      return jsonb_build_object('threadId',v_invite.thread_id,'alreadyAccepted',true);
    end if;
    return jsonb_build_object('error','INVITATION_ALREADY_USED');
  end if;
  if v_invite.status <> 'pending' then
    return jsonb_build_object('error','INVITATION_NOT_AVAILABLE');
  end if;
  if v_invite.expires_at <= now() then
    update public.correspondence_invitations set status='expired' where id=v_invite.id;
    return jsonb_build_object('error','INVITATION_EXPIRED');
  end if;

  select * into v_recipient from public.profiles where id=p_recipient_id;
  if not found or lower(coalesce(v_recipient.email,'')) <> v_invite.recipient_email then
    return jsonb_build_object('error','INVITATION_EMAIL_MISMATCH');
  end if;
  if p_recipient_id=v_invite.sender_id then
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
  values(v_invite.sender_id,coalesce(nullif(v_invite.snapshot->>'title',''),'A letter for you'))
  returning * into v_thread;

  insert into public.correspondence_participants(thread_id,profile_id,role)
  values(v_thread.id,v_invite.sender_id,'sender'),(v_thread.id,p_recipient_id,'recipient');

  insert into public.correspondence_messages(thread_id,sender_id,creation_id,creation_revision,snapshot)
  values(v_thread.id,v_invite.sender_id,v_invite.creation_id,v_invite.creation_revision,v_invite.snapshot);

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
    'threadId',v_thread.id,'subject',v_thread.subject,
    'senderName',coalesce(v_sender.display_name,'Lumie member')
  );
end;
$$;

revoke all on function public.lumie_accept_correspondence_invitation(text,uuid) from public, anon, authenticated;
grant execute on function public.lumie_accept_correspondence_invitation(text,uuid) to service_role;
