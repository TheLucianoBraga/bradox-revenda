create or replace view bradox_revenda.network_directory as
select
  n.id,
  n.name,
  n.slug,
  n.status,
  n.owner_id,
  owner.email as owner_email,
  coalesce(owner.full_name, owner.email, 'Sem responsavel') as owner_name,
  n.legacy_network_hub_id,
  (select count(*)::integer from bradox_revenda.profiles p where p.network_id = n.id and p.role = 'admin' and p.status <> 'inactive') as admins_count,
  (select count(*)::integer from bradox_revenda.profiles p where p.network_id = n.id and p.role = 'revenda' and p.status <> 'inactive') as revendas_count,
  (select count(*)::integer from bradox_revenda.profiles p where p.network_id = n.id and p.role = 'cliente' and p.status <> 'inactive') as clientes_count,
  (select count(*)::integer from bradox_revenda.servers s where s.network_id = n.id) as servers_count,
  (select count(*)::integer from bradox_revenda.plans pl where pl.network_id = n.id) as plans_count,
  (select count(*)::integer from bradox_revenda.message_templates mt where mt.network_id = n.id) as templates_count,
  (select count(*)::integer from bradox_revenda.orders o where o.network_id = n.id) as orders_count,
  (select count(*)::integer from bradox_revenda.orders o where o.network_id = n.id and o.status in ('pending', 'open', 'waiting_payment')) as open_orders_count,
  (select count(*)::integer from bradox_revenda.orders o where o.network_id = n.id and o.status in ('paid', 'approved', 'completed')) as paid_orders_count,
  (select coalesce(sum(o.amount), 0)::numeric(12,2) from bradox_revenda.orders o where o.network_id = n.id and o.status in ('paid', 'approved', 'completed')) as paid_orders_amount,
  (select count(*)::integer from bradox_revenda.useful_links ul where ul.network_id = n.id and ul.status = 'active') as active_useful_links_count,
  n.created_at,
  n.updated_at
from bradox_revenda.networks n
left join bradox_revenda.profiles owner on owner.id = n.owner_id
group by n.id, n.name, n.slug, n.status, n.owner_id, owner.email, owner.full_name, n.legacy_network_hub_id, n.created_at, n.updated_at;

create or replace view bradox_revenda.network_dashboard_summary as
select
  count(*)::integer as networks_count,
  count(*) filter (where status = 'active')::integer as active_networks_count,
  coalesce(sum(admins_count), 0)::integer as admins_count,
  coalesce(sum(revendas_count), 0)::integer as revendas_count,
  coalesce(sum(clientes_count), 0)::integer as clientes_count,
  coalesce(sum(servers_count), 0)::integer as servers_count,
  coalesce(sum(plans_count), 0)::integer as plans_count,
  coalesce(sum(templates_count), 0)::integer as templates_count,
  coalesce(sum(orders_count), 0)::integer as orders_count,
  coalesce(sum(open_orders_count), 0)::integer as open_orders_count,
  coalesce(sum(paid_orders_count), 0)::integer as paid_orders_count,
  coalesce(sum(paid_orders_amount), 0)::numeric(12,2) as paid_orders_amount,
  coalesce(sum(active_useful_links_count), 0)::integer as active_useful_links_count
from bradox_revenda.network_directory;

create or replace view bradox_revenda.reseller_customer_directory as
select
  h.id as hierarchy_id,
  h.network_id,
  n.name as network_name,
  reseller.id as reseller_id,
  coalesce(reseller.full_name, reseller.email, 'Revenda sem nome') as reseller_name,
  reseller.email as reseller_email,
  reseller.status as reseller_status,
  customer.id as customer_id,
  coalesce(customer.full_name, customer.email, 'Cliente sem nome') as customer_name,
  customer.email as customer_email,
  customer.phone as customer_phone,
  customer.status as customer_status,
  h.legacy_network_hub_id,
  h.created_at as linked_at
from bradox_revenda.user_hierarchy h
join bradox_revenda.profiles reseller on reseller.id = h.parent_user_id and reseller.role = 'revenda'
join bradox_revenda.profiles customer on customer.id = h.child_user_id and customer.role = 'cliente'
left join bradox_revenda.networks n on n.id = h.network_id;

create or replace view bradox_revenda.order_billing_directory as
select
  o.id,
  o.network_id,
  n.name as network_name,
  n.owner_id as network_owner_id,
  buyer.id as buyer_id,
  coalesce(buyer.full_name, buyer.email, o.metadata ->> 'customer_name', 'Cliente sem nome') as buyer_name,
  buyer.email as buyer_email,
  buyer.phone as buyer_phone,
  reseller.id as reseller_id,
  coalesce(reseller.full_name, reseller.email) as reseller_name,
  reseller.email as reseller_email,
  pl.id as plan_id,
  pl.name as plan_name,
  o.status,
  o.order_type,
  o.amount,
  o.metadata,
  o.legacy_network_hub_id,
  o.created_at,
  o.updated_at
from bradox_revenda.orders o
join bradox_revenda.networks n on n.id = o.network_id
left join bradox_revenda.profiles buyer on buyer.id = o.buyer_id
left join bradox_revenda.user_hierarchy h on h.child_user_id = buyer.id
left join bradox_revenda.profiles reseller on reseller.id = h.parent_user_id and reseller.role = 'revenda'
left join bradox_revenda.plans pl on pl.id = o.plan_id;

create or replace view bradox_revenda.public_revendas as
select
  p.id,
  p.network_id,
  n.name as network_name,
  coalesce(nullif(trim(p.full_name), ''), split_part(coalesce(p.email, 'revenda'), '@', 1)) as full_name,
  p.email,
  p.phone,
  p.role,
  p.status,
  p.created_at,
  coalesce(counts.linked_customers_count, 0)::integer as clientes_count
from bradox_revenda.profiles p
left join bradox_revenda.networks n on n.id = p.network_id
left join bradox_revenda.reseller_customer_counts counts on counts.reseller_id = p.id
where p.role = 'revenda'
  and p.status = 'active';

create or replace view bradox_revenda.migration_validation_counts as
with counts as (
  select * from (
    values
      ('networks', (select count(*)::integer from bradox_revenda.networks), (select count(*)::integer from network_hub.networks)),
      ('servers', (select count(*)::integer from bradox_revenda.servers), (select count(*)::integer from network_hub.servers)),
      ('plans', (select count(*)::integer from bradox_revenda.plans), (select count(*)::integer from network_hub.plans)),
      ('templates', (select count(*)::integer from bradox_revenda.message_templates), (select count(*)::integer from network_hub.message_templates)),
      ('orders', (select count(*)::integer from bradox_revenda.orders), (select count(*)::integer from network_hub.orders)),
      ('legacy_user_hierarchy', (select count(*)::integer from bradox_revenda.user_hierarchy where legacy_network_hub_id is not null), (select count(*)::integer from network_hub.user_hierarchy)),
      ('total_user_hierarchy', (select count(*)::integer from bradox_revenda.user_hierarchy), (select count(*)::integer from network_hub.user_hierarchy)),
      ('profiles_total', (select count(*)::integer from bradox_revenda.profiles), (select count(*)::integer from network_hub.profiles)),
      ('admins', (select count(*)::integer from bradox_revenda.profiles where role = 'admin' and status <> 'inactive'), (select count(*)::integer from network_hub.user_roles where role::text in ('super_admin', 'admin'))),
      ('revendas', (select count(*)::integer from bradox_revenda.profiles where role = 'revenda' and status <> 'inactive'), (select count(*)::integer from network_hub.user_roles where role::text in ('revenda', 'revenda_adm', 'revenda_admin', 'reseller', 'reseller_admin'))),
      ('clientes', (select count(*)::integer from bradox_revenda.profiles where role = 'cliente' and status <> 'inactive'), (select count(*)::integer from network_hub.user_roles where role::text = 'cliente'))
  ) as values_table(metric, target_count, legacy_count)
)
select
  metric,
  target_count,
  legacy_count,
  case
    when metric in ('profiles_total', 'clientes', 'legacy_user_hierarchy', 'total_user_hierarchy') then 'expected_may_differ'
    when target_count = legacy_count then 'ok'
    else 'review'
  end as validation_status,
  case
    when metric = 'profiles_total' then 'Destino inclui perfis Braga consolidados alem do recorte direto em network_hub.profiles.'
    when metric = 'clientes' then 'Destino inclui clientes Braga complementares migrados/normalizados para role cliente.'
    when metric = 'legacy_user_hierarchy' then 'Alguns links foram preservados por IDs legados gerados em migracao anterior, nao apenas pelo unico registro atual do legado.'
    when metric = 'total_user_hierarchy' then 'Destino inclui links complementares admin -> clientes para operacao assistida.'
    when target_count = legacy_count then 'Contagem bate com o legado auditado.'
    else 'Revisar divergencia antes do corte.'
  end as notes
from counts;

grant select on bradox_revenda.network_directory to authenticated;
grant select on bradox_revenda.network_dashboard_summary to authenticated;
grant select on bradox_revenda.reseller_customer_directory to authenticated;
grant select on bradox_revenda.order_billing_directory to authenticated;
grant select on bradox_revenda.migration_validation_counts to authenticated;
grant select on bradox_revenda.public_revendas to anon, authenticated;

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
  'phase5_read_models_validation',
  'completed',
  now(),
  now(),
  jsonb_build_object(
    'legacy_networks', (select count(*) from network_hub.networks),
    'legacy_servers', (select count(*) from network_hub.servers),
    'legacy_plans', (select count(*) from network_hub.plans),
    'legacy_templates', (select count(*) from network_hub.message_templates),
    'legacy_orders', (select count(*) from network_hub.orders)
  ),
  jsonb_build_object(
    'target_networks', (select count(*) from bradox_revenda.networks),
    'target_servers', (select count(*) from bradox_revenda.servers),
    'target_plans', (select count(*) from bradox_revenda.plans),
    'target_templates', (select count(*) from bradox_revenda.message_templates),
    'target_orders', (select count(*) from bradox_revenda.orders),
    'network_directory_rows', (select count(*) from bradox_revenda.network_directory),
    'reseller_customer_directory_rows', (select count(*) from bradox_revenda.reseller_customer_directory),
    'order_billing_directory_rows', (select count(*) from bradox_revenda.order_billing_directory)
  ),
  'Fase 5 criou read models consolidados para redes, resumo geral, clientes por revenda, cobrancas e comparacao de contagens com o legado. Divergencias esperadas: profiles_total e total_user_hierarchy podem ser maiores no destino por complementos Braga.'
)
on conflict do nothing;

delete from bradox_revenda.migration_batches mb
using (
  select
    id,
    row_number() over (partition by batch_name order by created_at desc, id desc) as row_number
  from bradox_revenda.migration_batches
  where batch_name = 'phase5_read_models_validation'
) duplicates
where mb.id = duplicates.id
  and duplicates.row_number > 1;

notify pgrst, 'reload schema';