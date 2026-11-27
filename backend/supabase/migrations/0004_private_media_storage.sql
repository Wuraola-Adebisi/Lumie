-- Pass 15: private image storage. Object paths are <auth.uid()>/<asset UUID>.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('lumie-private','lumie-private',false,10485760,array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy lumie_private_upload_own on storage.objects
for insert to authenticated
with check (
  bucket_id = 'lumie-private'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1 from public.assets a
    where a.object_key = name and a.owner_id = (select auth.uid()) and a.status = 'pending'
  )
);

create policy lumie_private_read_owner_or_recipient on storage.objects
for select to authenticated
using (
  bucket_id = 'lumie-private'
  and exists (
    select 1 from public.assets a
    where a.object_key = name and a.status = 'ready'
      and (
        a.owner_id = (select auth.uid())
        or exists (
          select 1 from public.asset_thread_grants g
          join public.correspondence_participants cp on cp.thread_id = g.thread_id
          where g.asset_id = a.id and cp.profile_id = (select auth.uid())
        )
      )
  )
);

create policy lumie_private_delete_owner on storage.objects
for delete to authenticated
using (
  bucket_id = 'lumie-private'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
