-- Pass 15: Supabase Auth-backed production data model.
-- Profiles are keyed to auth.users; no Cognito subject or custom session GUCs.
create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name varchar(80) not null default '',
  avatar_asset_id uuid,
  locale varchar(35) not null default 'en',
  time_zone varchar(64) not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.creations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  title varchar(80) not null check (length(trim(title)) between 1 and 80),
  format text not null check (format in ('letter','postcard','photo-card','collage','memory')),
  document_schema_version smallint not null default 2 check (document_schema_version = 2),
  document_json jsonb not null check (jsonb_typeof(document_json) = 'object'),
  revision integer not null default 1 check (revision >= 1),
  status text not null default 'draft' check (status in ('draft','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (owner_id,id)
);
create index creations_owner_updated_idx on public.creations(owner_id,updated_at desc,id desc);

create table public.creation_revisions (
  id uuid primary key default gen_random_uuid(),
  creation_id uuid not null,
  owner_id uuid not null,
  revision integer not null check (revision >= 1),
  document_json jsonb not null check (jsonb_typeof(document_json) = 'object'),
  created_at timestamptz not null default now(),
  foreign key (owner_id,creation_id) references public.creations(owner_id,id) on delete restrict,
  unique (creation_id,revision)
);
create index creation_revisions_owner_creation_idx on public.creation_revisions(owner_id,creation_id,revision desc);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  object_key text not null unique,
  original_file_name varchar(180) not null,
  content_type text not null check (content_type in ('image/jpeg','image/png','image/webp','image/avif')),
  size_bytes bigint not null check (size_bytes between 1 and 10485760),
  checksum_sha256 char(64),
  width integer check (width is null or width between 1 and 12000),
  height integer check (height is null or height between 1 and 12000),
  status text not null default 'pending' check (status in ('pending','ready','rejected','deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (owner_id,id)
);
create index assets_owner_created_idx on public.assets(owner_id,created_at desc);
alter table public.profiles add constraint profiles_avatar_asset_owner_fk
  foreign key (id,avatar_asset_id) references public.assets(owner_id,id)
  deferrable initially deferred;

create table public.correspondence_threads (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete restrict,
  subject varchar(100) not null check (length(trim(subject)) between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);
create index correspondence_threads_activity_idx on public.correspondence_threads(last_message_at desc,id desc);
create index correspondence_threads_created_by_idx on public.correspondence_threads(created_by);

create table public.correspondence_participants (
  thread_id uuid not null references public.correspondence_threads(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  role text not null check (role in ('sender','recipient')),
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  primary key(thread_id,profile_id)
);
create index correspondence_participants_profile_idx on public.correspondence_participants(profile_id,thread_id);

create table public.correspondence_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.correspondence_threads(id) on delete restrict,
  sender_id uuid not null references public.profiles(id) on delete restrict,
  creation_id uuid,
  creation_revision integer,
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  created_at timestamptz not null default now(),
  check ((creation_id is null) = (creation_revision is null))
);
create index correspondence_messages_thread_idx on public.correspondence_messages(thread_id,created_at asc,id asc);
create index correspondence_messages_sender_id_idx on public.correspondence_messages(sender_id);

create table public.asset_thread_grants (
  asset_id uuid not null references public.assets(id) on delete restrict,
  thread_id uuid not null references public.correspondence_threads(id) on delete restrict,
  granted_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key(asset_id,thread_id)
);
create index asset_thread_grants_thread_id_idx on public.asset_thread_grants(thread_id);
create index asset_thread_grants_granted_by_idx on public.asset_thread_grants(granted_by);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger creations_set_updated_at before update on public.creations
for each row execute function public.set_updated_at();
create trigger assets_set_updated_at before update on public.assets
for each row execute function public.set_updated_at();
create trigger correspondence_threads_set_updated_at before update on public.correspondence_threads
for each row execute function public.set_updated_at();

-- Display name is presentation metadata only; never use user_metadata for access control.
create or replace function public.provision_lumie_profile()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles(id,display_name)
  values (new.id,left(trim(coalesce(new.raw_user_meta_data ->> 'display_name','')),80))
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function public.provision_lumie_profile() from public, anon, authenticated;
create trigger on_auth_user_created_lumie
after insert on auth.users
for each row execute function public.provision_lumie_profile();

alter table public.profiles enable row level security;
alter table public.creations enable row level security;
alter table public.creation_revisions enable row level security;
alter table public.assets enable row level security;
alter table public.correspondence_threads enable row level security;
alter table public.correspondence_participants enable row level security;
alter table public.correspondence_messages enable row level security;
alter table public.asset_thread_grants enable row level security;

create policy profiles_select_own on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy profiles_update_own on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy creations_select_own on public.creations for select to authenticated using (owner_id = (select auth.uid()));
create policy creations_insert_own on public.creations for insert to authenticated with check (owner_id = (select auth.uid()));
create policy creations_update_own on public.creations for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

create policy revisions_select_own on public.creation_revisions for select to authenticated using (owner_id = (select auth.uid()));
create policy revisions_insert_own on public.creation_revisions for insert to authenticated with check (
  owner_id = (select auth.uid())
  and exists (select 1 from public.creations c where c.id = creation_id and c.owner_id = (select auth.uid()))
);

create policy assets_select_owner_or_shared on public.assets for select to authenticated using (
  owner_id = (select auth.uid())
  or exists (
    select 1 from public.asset_thread_grants g
    join public.correspondence_participants cp on cp.thread_id = g.thread_id
    where g.asset_id = assets.id and cp.profile_id = (select auth.uid())
  )
);
create policy assets_insert_own on public.assets for insert to authenticated with check (owner_id = (select auth.uid()));
create policy assets_update_own on public.assets for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

create policy threads_select_member on public.correspondence_threads for select to authenticated using (
  exists (select 1 from public.correspondence_participants cp where cp.thread_id = correspondence_threads.id and cp.profile_id = (select auth.uid()))
);
create policy threads_insert_creator on public.correspondence_threads for insert to authenticated with check (created_by = (select auth.uid()));
create policy threads_update_member on public.correspondence_threads for update to authenticated
using (exists (select 1 from public.correspondence_participants cp where cp.thread_id = correspondence_threads.id and cp.profile_id = (select auth.uid())))
with check (exists (select 1 from public.correspondence_participants cp where cp.thread_id = correspondence_threads.id and cp.profile_id = (select auth.uid())));

create policy participants_select_self on public.correspondence_participants for select to authenticated using (profile_id = (select auth.uid()));
create policy participants_insert_thread_creator on public.correspondence_participants for insert to authenticated with check (
  exists (select 1 from public.correspondence_threads t where t.id = thread_id and t.created_by = (select auth.uid()))
  and (profile_id = (select auth.uid()) or role = 'recipient')
);

create policy messages_select_thread_member on public.correspondence_messages for select to authenticated using (
  exists (select 1 from public.correspondence_participants cp where cp.thread_id = correspondence_messages.thread_id and cp.profile_id = (select auth.uid()))
);
create policy messages_insert_thread_member on public.correspondence_messages for insert to authenticated with check (
  sender_id = (select auth.uid())
  and exists (select 1 from public.correspondence_participants cp where cp.thread_id = correspondence_messages.thread_id and cp.profile_id = (select auth.uid()))
);

create policy grants_select_thread_member on public.asset_thread_grants for select to authenticated using (
  exists (select 1 from public.correspondence_participants cp where cp.thread_id = asset_thread_grants.thread_id and cp.profile_id = (select auth.uid()))
);
create policy grants_insert_owner on public.asset_thread_grants for insert to authenticated with check (
  granted_by = (select auth.uid())
  and exists (select 1 from public.assets a where a.id = asset_id and a.owner_id = (select auth.uid()) and a.status = 'ready')
  and exists (select 1 from public.correspondence_participants cp where cp.thread_id = asset_thread_grants.thread_id and cp.profile_id = (select auth.uid()))
);

revoke update, delete on public.creation_revisions from anon, authenticated;
revoke update, delete on public.correspondence_messages from anon, authenticated;
revoke delete on public.creations, public.assets, public.correspondence_threads, public.correspondence_participants, public.asset_thread_grants from anon, authenticated;

grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.creations to authenticated;
grant select, insert on public.creation_revisions to authenticated;
grant select, insert, update on public.assets to authenticated;
grant select, insert, update on public.correspondence_threads to authenticated;
grant select, insert, update on public.correspondence_participants to authenticated;
grant select, insert on public.correspondence_messages to authenticated;
grant select, insert on public.asset_thread_grants to authenticated;
