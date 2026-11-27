-- Pass 17B follow-up: index invitation foreign keys and optimise the sender policy.
create index if not exists correspondence_invitations_accepted_by_idx
  on public.correspondence_invitations(accepted_by)
  where accepted_by is not null;

create index if not exists correspondence_invitations_creation_id_idx
  on public.correspondence_invitations(creation_id);

create index if not exists correspondence_invitations_thread_id_idx
  on public.correspondence_invitations(thread_id)
  where thread_id is not null;

drop policy if exists correspondence_invitations_read_sender on public.correspondence_invitations;
create policy correspondence_invitations_read_sender
  on public.correspondence_invitations for select to authenticated
  using (sender_id = (select auth.uid()));
