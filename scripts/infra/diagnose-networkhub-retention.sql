select
  'database_size' as metric,
  pg_size_pretty(pg_database_size(current_database())) as value;

select
  schemaname || '.' || relname as table_name,
  pg_size_pretty(pg_total_relation_size(format('%I.%I', schemaname, relname))) as total_size
from pg_stat_user_tables
order by pg_total_relation_size(format('%I.%I', schemaname, relname)) desc
limit 30;

select
  count(*) as inbound_rows,
  min(created_at) as first_inbound_at,
  max(created_at) as last_inbound_at,
  pg_size_pretty(pg_total_relation_size('public.whatsapp_inbound_messages')) as inbound_total_size
from public.whatsapp_inbound_messages;

select
  date_trunc('day', created_at)::date as day,
  count(*) as rows
from public.whatsapp_inbound_messages
group by 1
order by 1;

select
  'older_than_7_days' as window,
  count(*) as rows
from public.whatsapp_inbound_messages
where created_at < now() - interval '7 days'
union all
select
  'older_than_15_days',
  count(*)
from public.whatsapp_inbound_messages
where created_at < now() - interval '15 days'
union all
select
  'older_than_30_days',
  count(*)
from public.whatsapp_inbound_messages
where created_at < now() - interval '30 days';