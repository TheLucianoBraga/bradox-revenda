drop view if exists bradox_revenda.public_revendas;

create or replace view bradox_revenda.public_revendas as
select
  p.id,
  p.network_id,
  n.name as network_name,
  coalesce(p.full_name, p.email, 'Revenda sem nome') as full_name,
  p.email,
  p.phone,
  p.role,
  p.status,
  p.created_at,
  (
    select count(*)::integer
    from bradox_revenda.user_hierarchy uh
    join bradox_revenda.profiles child on child.id = uh.child_user_id
    where uh.parent_user_id = p.id
      and child.role = 'cliente'
      and child.status = 'active'
  ) as clientes_count
from bradox_revenda.profiles p
left join bradox_revenda.networks n on n.id = p.network_id
where p.role = 'cliente'
  and n.slug = 'admin';

grant select on bradox_revenda.public_revendas to anon, authenticated;

notify pgrst, 'reload schema';