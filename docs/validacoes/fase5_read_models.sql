select 'network_directory' as check_name, count(*) as rows_count
from bradox_revenda.network_directory;

select 'network_dashboard_summary' as check_name, *
from bradox_revenda.network_dashboard_summary;

select 'reseller_customer_directory' as check_name, count(*) as rows_count
from bradox_revenda.reseller_customer_directory;

select 'order_billing_directory' as check_name, count(*) as rows_count
from bradox_revenda.order_billing_directory;

select 'public_revendas' as check_name, count(*) as rows_count
from bradox_revenda.public_revendas;

select
  metric,
  target_count,
  legacy_count,
  validation_status,
  notes
from bradox_revenda.migration_validation_counts
order by metric;

select
  id,
  name,
  owner_email,
  admins_count,
  revendas_count,
  clientes_count,
  servers_count,
  plans_count,
  templates_count,
  orders_count
from bradox_revenda.network_directory
order by created_at;