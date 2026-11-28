-- Durable email notification queue and account-level delivery preferences.
create table public.email_notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  email_correspondence boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.email_notification_preferences enable row level security;
alter table public.email_notification_preferences force row level security;

create policy "Users can read their email notification preferences"
  on public.email_notification_preferences for select to authenticated
  using (user_id = auth.uid());

create policy "Users can create their email notification preferences"
  on public.email_notification_preferences for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can update their email notification preferences"
  on public.email_notification_preferences for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update on public.email_notification_preferences to authenticated;

create table public.email_notification_outbox (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('correspondence_received', 'invitation_received')),
  recipient_email text not null check (recipient_email = lower(trim(recipient_email))),
  recipient_profile_id uuid references public.profiles(id) on delete set null,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  dedupe_key text not null unique,
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'failed')),
  attempts smallint not null default 0 check (attempts >= 0 and attempts <= 20),
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  sent_at timestamptz,
  provider_message_id text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index email_notification_outbox_pending_idx
  on public.email_notification_outbox (available_at, created_at)
  where status in ('pending', 'processing');

create index email_notification_outbox_recipient_idx
  on public.email_notification_outbox (recipient_profile_id, created_at desc)
  where recipient_profile_id is not null;

alter table public.email_notification_outbox enable row level security;
alter table public.email_notification_outbox force row level security;
revoke all on public.email_notification_outbox from anon, authenticated;
grant select, insert, update, delete on public.email_notification_outbox to service_role;

create or replace function public.lumie_claim_email_notification_batch(p_limit integer default 25)
returns setof public.email_notification_outbox
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return query
  with candidates as (
    select id
    from public.email_notification_outbox
    where (status = 'pending' and available_at <= now())
       or (status = 'processing' and locked_at < now() - interval '10 minutes')
    order by available_at asc, created_at asc
    limit least(greatest(coalesce(p_limit, 25), 1), 100)
    for update skip locked
  )
  update public.email_notification_outbox as queued
  set status = 'processing',
      locked_at = now(),
      attempts = queued.attempts + 1,
      updated_at = now()
  from candidates
  where queued.id = candidates.id
  returning queued.*;
end;
$$;

revoke all on function public.lumie_claim_email_notification_batch(integer) from public, anon, authenticated;
grant execute on function public.lumie_claim_email_notification_batch(integer) to service_role;

create or replace function public.lumie_enqueue_correspondence_email_notification()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  recipient record;
  sender_name text;
begin
  select coalesce(nullif(trim(display_name), ''), 'A Lumie member')
    into sender_name
  from public.profiles
  where id = new.sender_id;

  for recipient in
    select p.id, p.email, coalesce(preferences.email_correspondence, true) as enabled
    from public.correspondence_participants as participants
    join public.profiles as p on p.id = participants.profile_id
    left join public.email_notification_preferences as preferences on preferences.user_id = p.id
    where participants.thread_id = new.thread_id
      and participants.profile_id <> new.sender_id
  loop
    if recipient.email is not null and recipient.enabled then
      insert into public.email_notification_outbox (
        event_type, recipient_email, recipient_profile_id, payload, dedupe_key, available_at
      ) values (
        'correspondence_received',
        lower(trim(recipient.email)),
        recipient.id,
        jsonb_build_object('threadId', new.thread_id, 'senderName', sender_name),
        'correspondence:' || new.id::text || ':' || recipient.id::text,
        greatest(coalesce(new.available_at, now()), now())
      )
      on conflict (dedupe_key) do nothing;
    end if;
  end loop;

  return new;
end;
$$;

revoke all on function public.lumie_enqueue_correspondence_email_notification() from public, anon, authenticated;

create trigger correspondence_messages_enqueue_email_notification
  after insert on public.correspondence_messages
  for each row execute function public.lumie_enqueue_correspondence_email_notification();
