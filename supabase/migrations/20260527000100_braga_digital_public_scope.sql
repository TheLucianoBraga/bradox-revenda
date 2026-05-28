do $$
begin
  if not exists (
    select 1
    from bradox_revenda.networks
    where id = '5abd8d41-00d3-4438-bb1f-97f250ab23cb'::uuid
      and slug = 'admin'
  ) then
    raise exception 'Braga Digital network not found with expected id/slug';
  end if;
end $$;

drop policy if exists "Public read networks for staging" on bradox_revenda.networks;
create policy "Public read networks for staging" on bradox_revenda.networks
for select to anon
using (
  status = 'active'
  and id = '5abd8d41-00d3-4438-bb1f-97f250ab23cb'::uuid
);

drop policy if exists "Public read active servers for staging" on bradox_revenda.servers;
create policy "Public read active servers for staging" on bradox_revenda.servers
for select to anon
using (
  status = 'active'
  and network_id = '5abd8d41-00d3-4438-bb1f-97f250ab23cb'::uuid
);

drop policy if exists "Public read active plans for staging" on bradox_revenda.plans;
create policy "Public read active plans for staging" on bradox_revenda.plans
for select to anon
using (
  status = 'active'
  and network_id = '5abd8d41-00d3-4438-bb1f-97f250ab23cb'::uuid
);

drop policy if exists "Public read templates for staging" on bradox_revenda.message_templates;
create policy "Public read templates for staging" on bradox_revenda.message_templates
for select to anon
using (network_id = '5abd8d41-00d3-4438-bb1f-97f250ab23cb'::uuid);

drop view if exists bradox_revenda.public_revendas;

create or replace view bradox_revenda.public_revendas as
select
  p.id,
  p.network_id,
  n.name as network_name,
  coalesce(nullif(trim(p.full_name), ''), split_part(p.email, '@', 1)) as full_name,
  p.email,
  p.phone,
  p.role,
  p.status,
  p.created_at,
  0::integer as clientes_count
from bradox_revenda.profiles p
left join bradox_revenda.networks n on n.id = p.network_id
where p.role = 'cliente'
  and p.network_id = '5abd8d41-00d3-4438-bb1f-97f250ab23cb'::uuid;

grant select on bradox_revenda.public_revendas to anon, authenticated;

notify pgrst, 'reload schema';