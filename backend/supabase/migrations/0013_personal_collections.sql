-- Pass 18A: private, account-owned collections of saved creations.
create table public.collections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 80),
  description text not null default '' check (char_length(description) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index collections_owner_created_idx on public.collections(owner_id,created_at desc);

create table public.collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  creation_id uuid not null references public.creations(id) on delete restrict,
  creation_revision integer not null check (creation_revision > 0),
  snapshot jsonb not null check (jsonb_typeof(snapshot)='object'),
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  unique(collection_id,creation_id,creation_revision)
);
create index collection_items_collection_position_idx on public.collection_items(collection_id,position,created_at);
create index collection_items_owner_idx on public.collection_items(owner_id);
create index collection_items_creation_idx on public.collection_items(creation_id);

alter table public.collections enable row level security;
alter table public.collections force row level security;
alter table public.collection_items enable row level security;
alter table public.collection_items force row level security;

revoke all on public.collections from anon,authenticated;
grant select,delete on public.collections to authenticated;
grant insert(owner_id,title,description) on public.collections to authenticated;
grant update(title,description) on public.collections to authenticated;

revoke all on public.collection_items from anon,authenticated;
grant select,delete on public.collection_items to authenticated;
grant insert(owner_id,collection_id,creation_id,creation_revision,snapshot,position)
  on public.collection_items to authenticated;

create policy collections_select_owner on public.collections for select to authenticated
  using (owner_id=(select auth.uid()));
create policy collections_insert_owner on public.collections for insert to authenticated
  with check (owner_id=(select auth.uid()));
create policy collections_update_owner on public.collections for update to authenticated
  using (owner_id=(select auth.uid())) with check (owner_id=(select auth.uid()));
create policy collections_delete_owner on public.collections for delete to authenticated
  using (owner_id=(select auth.uid()));

create policy collection_items_select_owner on public.collection_items for select to authenticated
  using (
    owner_id=(select auth.uid())
    and exists (select 1 from public.collections c where c.id=collection_id and c.owner_id=(select auth.uid()))
  );
create policy collection_items_insert_owner on public.collection_items for insert to authenticated
  with check (
    owner_id=(select auth.uid())
    and exists (select 1 from public.collections c where c.id=collection_id and c.owner_id=(select auth.uid()))
    and exists (select 1 from public.creations cr where cr.id=creation_id and cr.owner_id=(select auth.uid()) and cr.revision=creation_revision)
  );
create policy collection_items_delete_owner on public.collection_items for delete to authenticated
  using (
    owner_id=(select auth.uid())
    and exists (select 1 from public.collections c where c.id=collection_id and c.owner_id=(select auth.uid()))
  );

create or replace function public.touch_collection_updated_at()
returns trigger language plpgsql set search_path=''
as $$ begin new.updated_at=now(); return new; end; $$;
revoke all on function public.touch_collection_updated_at() from public,anon,authenticated;
create trigger collections_touch_updated_at before update on public.collections
for each row execute function public.touch_collection_updated_at();
