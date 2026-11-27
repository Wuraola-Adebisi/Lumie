-- Pass 15 follow-up: close bootstrap and asset lifecycle gaps found in live RLS review.
-- Thread creators need to see their own newly-created thread while adding the initial participants.
create policy threads_select_creator on public.correspondence_threads
for select to authenticated
using (created_by = (select auth.uid()));

-- Asset status transitions and shared-asset grants are server-controlled.
-- Authenticated users may create pending metadata and upload their own object,
-- but cannot mark an upload ready or manufacture a correspondence grant.
drop policy if exists assets_update_own on public.assets;
revoke update on public.assets from anon, authenticated;
revoke insert on public.asset_thread_grants from anon, authenticated;

-- Object deletion is handled by a controlled lifecycle operation, not direct browser requests.
drop policy if exists lumie_private_delete_owner on storage.objects;
