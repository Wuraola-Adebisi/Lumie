-- Pass 18B: token-gated guest contributions to private collections.
create table public.collection_guest_links (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz not null default (now() + interval '30 days'),
  revoked_at timestamptz,
  max_contributions integer not null default 100 check (max_contributions between 1 and 500),
  contribution_count integer not null default 0 check (contribution_count >= 0 and contribution_count <= max_contributions),
  created_at timestamptz not null default now()
);
create unique index collection_guest_links_one_active_per_collection_idx
  on public.collection_guest_links(collection_id) where revoked_at is null;
create index collection_guest_links_owner_idx on public.collection_guest_links(owner_id);
create index collection_guest_links_expiry_idx on public.collection_guest_links(expires_at);

create table public.collection_contributions (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  guest_link_id uuid references public.collection_guest_links(id) on delete set null,
  guest_name text not null check (char_length(trim(guest_name)) between 1 and 80),
  guest_email text check (guest_email is null or char_length(guest_email) <= 254),
  message text not null check (char_length(trim(message)) between 1 and 5000),
  status text not null default 'pending' check (status in ('pending','accepted','rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index collection_contributions_collection_created_idx
  on public.collection_contributions(collection_id,created_at desc);
create index collection_contributions_owner_status_idx
  on public.collection_contributions(owner_id,status);

alter table public.collection_guest_links enable row level security;
alter table public.collection_guest_links force row level security;
alter table public.collection_contributions enable row level security;
alter table public.collection_contributions force row level security;

revoke all on public.collection_guest_links from anon,authenticated;
grant select,delete on public.collection_guest_links to authenticated;
grant insert(owner_id,collection_id,token_hash,expires_at,max_contributions) on public.collection_guest_links to authenticated;
grant update(revoked_at) on public.collection_guest_links to authenticated;

revoke all on public.collection_contributions from anon,authenticated;
grant select,delete on public.collection_contributions to authenticated;
grant update(status,reviewed_at) on public.collection_contributions to authenticated;

create policy collection_guest_links_select_owner on public.collection_guest_links for select to authenticated
  using (owner_id=(select auth.uid()) and exists (
    select 1 from public.collections c where c.id=collection_id and c.owner_id=(select auth.uid())
  ));
create policy collection_guest_links_insert_owner on public.collection_guest_links for insert to authenticated
  with check (owner_id=(select auth.uid()) and exists (
    select 1 from public.collections c where c.id=collection_id and c.owner_id=(select auth.uid())
  ));
create policy collection_guest_links_update_owner on public.collection_guest_links for update to authenticated
  using (owner_id=(select auth.uid()) and exists (
    select 1 from public.collections c where c.id=collection_id and c.owner_id=(select auth.uid())
  ))
  with check (owner_id=(select auth.uid()) and exists (
    select 1 from public.collections c where c.id=collection_id and c.owner_id=(select auth.uid())
  ));
create policy collection_guest_links_delete_owner on public.collection_guest_links for delete to authenticated
  using (owner_id=(select auth.uid()) and exists (
    select 1 from public.collections c where c.id=collection_id and c.owner_id=(select auth.uid())
  ));

create policy collection_contributions_select_owner on public.collection_contributions for select to authenticated
  using (owner_id=(select auth.uid()) and exists (
    select 1 from public.collections c where c.id=collection_id and c.owner_id=(select auth.uid())
  ));
create policy collection_contributions_update_owner on public.collection_contributions for update to authenticated
  using (owner_id=(select auth.uid()) and exists (
    select 1 from public.collections c where c.id=collection_id and c.owner_id=(select auth.uid())
  ))
  with check (owner_id=(select auth.uid()) and exists (
    select 1 from public.collections c where c.id=collection_id and c.owner_id=(select auth.uid())
  ));
create policy collection_contributions_delete_owner on public.collection_contributions for delete to authenticated
  using (owner_id=(select auth.uid()) and exists (
    select 1 from public.collections c where c.id=collection_id and c.owner_id=(select auth.uid())
  ));

create or replace function public.lumie_get_collection_guest_link(p_token_hash text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare
  v_link public.collection_guest_links;
  v_collection public.collections;
  v_owner public.profiles;
begin
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    return jsonb_build_object('error','LINK_NOT_AVAILABLE');
  end if;
  select * into v_link from public.collection_guest_links
  where token_hash=p_token_hash and revoked_at is null and expires_at>now()
    and contribution_count<max_contributions;
  if not found then return jsonb_build_object('error','LINK_NOT_AVAILABLE'); end if;
  select * into v_collection from public.collections where id=v_link.collection_id;
  select * into v_owner from public.profiles where id=v_collection.owner_id;
  return jsonb_build_object(
    'collectionTitle',v_collection.title,
    'description',v_collection.description,
    'ownerName',coalesce(nullif(v_owner.display_name,''),'A Lumie member'),
    'expiresAt',v_link.expires_at,
    'remaining',v_link.max_contributions-v_link.contribution_count
  );
end;
$$;
revoke all on function public.lumie_get_collection_guest_link(text) from public;
grant execute on function public.lumie_get_collection_guest_link(text) to anon,authenticated;

create or replace function public.lumie_submit_collection_contribution(
  p_token_hash text,p_guest_name text,p_guest_email text,p_message text
)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare
  v_link public.collection_guest_links;
  v_collection public.collections;
  v_contribution public.collection_contributions;
begin
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    return jsonb_build_object('error','LINK_NOT_AVAILABLE');
  end if;
  if p_guest_name is null or char_length(trim(p_guest_name)) not between 1 and 80
     or p_message is null or char_length(trim(p_message)) not between 1 and 5000 then
    return jsonb_build_object('error','INVALID_CONTRIBUTION');
  end if;
  if p_guest_email is not null and p_guest_email <> ''
     and (char_length(trim(p_guest_email))>254 or trim(p_guest_email) !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') then
    return jsonb_build_object('error','INVALID_EMAIL');
  end if;
  select * into v_link from public.collection_guest_links where token_hash=p_token_hash for update;
  if not found or v_link.revoked_at is not null or v_link.expires_at<=now()
     or v_link.contribution_count>=v_link.max_contributions then
    return jsonb_build_object('error','LINK_NOT_AVAILABLE');
  end if;
  select * into v_collection from public.collections where id=v_link.collection_id;
  if not found then return jsonb_build_object('error','LINK_NOT_AVAILABLE'); end if;
  insert into public.collection_contributions(collection_id,owner_id,guest_link_id,guest_name,guest_email,message)
  values(v_link.collection_id,v_link.owner_id,v_link.id,trim(p_guest_name),nullif(lower(trim(coalesce(p_guest_email,''))),''),trim(p_message))
  returning * into v_contribution;
  update public.collection_guest_links set contribution_count=contribution_count+1 where id=v_link.id;
  return jsonb_build_object('contributionId',v_contribution.id,'collectionTitle',v_collection.title);
end;
$$;
revoke all on function public.lumie_submit_collection_contribution(text,text,text,text) from public;
grant execute on function public.lumie_submit_collection_contribution(text,text,text,text) to anon,authenticated;
