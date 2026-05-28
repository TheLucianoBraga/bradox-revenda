select 'bradox_revenda.networks' as table_name, count(*) as rows from bradox_revenda.networks
union all select 'bradox_revenda.profiles', count(*) from bradox_revenda.profiles
union all select 'bradox_revenda.user_hierarchy', count(*) from bradox_revenda.user_hierarchy
union all select 'bradox_revenda.servers', count(*) from bradox_revenda.servers
union all select 'bradox_revenda.plans', count(*) from bradox_revenda.plans
union all select 'bradox_revenda.orders', count(*) from bradox_revenda.orders
union all select 'bradox_revenda.message_templates', count(*) from bradox_revenda.message_templates
order by table_name;

select
  'legacy id duplicates' as check_name,
  (
    select count(*) from bradox_revenda.networks where legacy_network_hub_id is not null
  ) as networks_with_legacy,
  (
    select count(*) from bradox_revenda.profiles where legacy_network_hub_id is not null
  ) as profiles_with_legacy;