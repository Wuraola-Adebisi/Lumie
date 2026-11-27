drop policy if exists threads_select_creator on public.correspondence_threads;
drop policy if exists threads_select_member on public.correspondence_threads;
drop policy if exists threads_select_creator_or_member on public.correspondence_threads;
create policy threads_select_creator_or_member on public.correspondence_threads
for select to authenticated
using (
  created_by = (select auth.uid())
  or exists (
    select 1 from public.correspondence_participants cp
    where cp.thread_id = correspondence_threads.id and cp.profile_id = (select auth.uid())
  )
);