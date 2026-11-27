-- Pass 18B security hardening: keep SECURITY DEFINER RPCs out of the public API.
drop function if exists public.lumie_get_collection_guest_link(text);

revoke all on function public.lumie_submit_collection_contribution(text,text,text,text)
  from public,anon,authenticated;
grant execute on function public.lumie_submit_collection_contribution(text,text,text,text)
  to service_role;

create index if not exists collection_contributions_guest_link_idx
  on public.collection_contributions(guest_link_id)
  where guest_link_id is not null;
