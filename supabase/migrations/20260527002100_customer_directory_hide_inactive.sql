create or replace view bradox_revenda.customer_directory as
select
  p.id,
  p.network_id,
  n.name as network_name,
  coalesce(p.full_name, p.email, 'Cliente sem nome'::text) as full_name,
  p.email,
  p.phone,
  p.role::text::bradox_revenda.app_role as role,
  p.status,
  p.created_at,
  count(children.child_user_id)::integer as linked_customers_count
from bradox_revenda.profiles p
left join bradox_revenda.networks n on n.id = p.network_id
left join bradox_revenda.user_hierarchy children on children.parent_user_id = p.id
where p.role = 'cliente'::bradox_revenda.app_role
  and p.status <> 'inactive'
group by p.id, p.network_id, n.name, p.full_name, p.email, p.phone, p.role, p.status, p.created_at;

grant select on bradox_revenda.customer_directory to anon, authenticated;

insert into bradox_revenda.migration_batches (
  source_project,
  batch_name,
  status,
  started_at,
  finished_at,
  target_counts,
  notes
)
values (
  'bradox-revenda',
  'phase8_customer_directory_hide_inactive',
  'completed',
  now(),
  now(),
  jsonb_build_object(
    'visible_customers', (select count(*) from bradox_revenda.customer_directory),
    'inactive_profiles', (select count(*) from bradox_revenda.profiles where role = 'cliente' and status = 'inactive')
  ),
  'customer_directory deixa de expor clientes inativos para que exclusao logica nao reapareca nas telas.'
)
on conflict do nothing;

notify pgrst, 'reload schema';
