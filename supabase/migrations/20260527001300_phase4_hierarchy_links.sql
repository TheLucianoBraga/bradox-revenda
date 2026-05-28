-- Phase 4: complete hierarchy links without inventing roles.
-- Existing Braga data has no active revenda yet, so revenda links are generic and
-- will activate as soon as imported/created revendas own a network with clients.

update bradox_revenda.networks n
set
  owner_id = p.id,
  updated_at = now()
from bradox_revenda.profiles p
where n.id = p.network_id
  and p.role = 'admin'
  and p.status = 'active'
  and (n.owner_id is null or n.owner_id = p.id);

with legacy_links as (
  select
    lh.id as legacy_hierarchy_id,
    parent_profile.id as parent_user_id,
    child_profile.id as child_user_id,
    coalesce(child_profile.network_id, parent_profile.network_id) as network_id,
    lh.created_at
  from network_hub.user_hierarchy lh
  join bradox_revenda.profiles parent_profile
    on parent_profile.legacy_network_hub_id = lh.parent_id
    or parent_profile.id = lh.parent_id
  join bradox_revenda.profiles child_profile
    on child_profile.legacy_network_hub_id = lh.user_id
    or child_profile.id = lh.user_id
  where parent_profile.role in ('admin', 'revenda')
    and child_profile.role = 'cliente'
    and parent_profile.id <> child_profile.id
)
insert into bradox_revenda.user_hierarchy (
  network_id,
  parent_user_id,
  child_user_id,
  legacy_network_hub_id,
  created_at
)
select
  network_id,
  parent_user_id,
  child_user_id,
  legacy_hierarchy_id,
  coalesce(created_at, now())
from legacy_links
on conflict (parent_user_id, child_user_id) do update set
  network_id = coalesce(excluded.network_id, bradox_revenda.user_hierarchy.network_id),
  legacy_network_hub_id = coalesce(bradox_revenda.user_hierarchy.legacy_network_hub_id, excluded.legacy_network_hub_id);

with reseller_clients as (
  select
    revenda.network_id,
    revenda.id as parent_user_id,
    cliente.id as child_user_id
  from bradox_revenda.profiles revenda
  join bradox_revenda.profiles cliente
    on cliente.network_id = revenda.network_id
   and cliente.role = 'cliente'
   and cliente.status <> 'inactive'
  where revenda.role = 'revenda'
    and revenda.status = 'active'
    and revenda.network_id is not null
    and revenda.id <> cliente.id
)
insert into bradox_revenda.user_hierarchy (
  network_id,
  parent_user_id,
  child_user_id,
  created_at
)
select
  network_id,
  parent_user_id,
  child_user_id,
  now()
from reseller_clients
on conflict (parent_user_id, child_user_id) do update set
  network_id = excluded.network_id;

create or replace view bradox_revenda.reseller_customer_counts as
select
  revenda.id as reseller_id,
  revenda.network_id,
  n.name as network_name,
  coalesce(revenda.full_name, revenda.email, 'Revenda sem nome') as reseller_name,
  revenda.email as reseller_email,
  (
    select count(distinct h.child_user_id)::integer
    from bradox_revenda.user_hierarchy h
    join bradox_revenda.profiles c on c.id = h.child_user_id
    where h.parent_user_id = revenda.id
      and c.role = 'cliente'
      and c.status <> 'inactive'
  ) as linked_customers_count,
  (
    select count(*)::integer
    from bradox_revenda.profiles c
    where c.network_id = revenda.network_id
      and c.role = 'cliente'
      and c.status <> 'inactive'
  ) as same_network_customers_count,
  (
    select count(*)::integer
    from bradox_revenda.profiles c
    where c.network_id = revenda.network_id
      and c.role = 'cliente'
      and c.status <> 'inactive'
      and not exists (
        select 1
        from bradox_revenda.user_hierarchy h
        where h.parent_user_id = revenda.id
          and h.child_user_id = c.id
      )
  ) as unlinked_same_network_customers_count
from bradox_revenda.profiles revenda
left join bradox_revenda.networks n on n.id = revenda.network_id
where revenda.role = 'revenda'
group by revenda.id, revenda.network_id, n.name, revenda.full_name, revenda.email;

create or replace view bradox_revenda.reseller_directory as
select
  p.id,
  p.network_id,
  n.name as network_name,
  n.slug as network_slug,
  coalesce(p.full_name, p.email, 'Revenda sem nome') as full_name,
  p.email,
  p.phone,
  p.role,
  p.status,
  p.requested_network_name,
  p.approved_at,
  p.created_at,
  coalesce(counts.linked_customers_count, 0)::integer as linked_customers_count
from bradox_revenda.profiles p
left join bradox_revenda.networks n on n.id = p.network_id
left join bradox_revenda.reseller_customer_counts counts on counts.reseller_id = p.id
where p.role = 'revenda';

grant select on bradox_revenda.reseller_customer_counts to authenticated;
grant select on bradox_revenda.reseller_directory to authenticated;

insert into bradox_revenda.migration_batches (
  source_project,
  batch_name,
  status,
  started_at,
  finished_at,
  source_counts,
  target_counts,
  notes
)
values (
  'network-hub',
  'phase4_hierarchy_links',
  'completed',
  now(),
  now(),
  jsonb_build_object(
    'legacy_user_hierarchy', (select count(*) from network_hub.user_hierarchy),
    'active_revendas', (select count(*) from bradox_revenda.profiles where role = 'revenda' and status = 'active')
  ),
  jsonb_build_object(
    'admin_networks_owned', (select count(*) from bradox_revenda.networks n join bradox_revenda.profiles p on p.id = n.owner_id where p.role = 'admin'),
    'admin_customer_links', (select count(*) from bradox_revenda.user_hierarchy h join bradox_revenda.profiles p on p.id = h.parent_user_id where p.role = 'admin'),
    'reseller_customer_links', (select count(*) from bradox_revenda.user_hierarchy h join bradox_revenda.profiles p on p.id = h.parent_user_id where p.role = 'revenda'),
    'resellers_validated', (select count(*) from bradox_revenda.reseller_customer_counts),
    'resellers_with_unlinked_customers', (select count(*) from bradox_revenda.reseller_customer_counts where unlinked_same_network_customers_count > 0)
  ),
  'Hierarquia complementar: redes com admin ativo recebem owner_id; vinculos legados admin/revenda -> cliente sao preservados; revendas ativas sao ligadas aos clientes da propria rede; contagem por revenda validada em reseller_customer_counts. Sem revendas ativas no recorte Braga atual, logo reseller_customer_links = 0 esperado.'
)
on conflict do nothing;

notify pgrst, 'reload schema';