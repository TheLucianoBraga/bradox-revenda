alter table bradox_revenda.profiles
  add column if not exists legacy_role_raw text,
  add column if not exists legacy_role_mapping_reason text;

create or replace function bradox_revenda.normalize_legacy_role(raw_role text, user_email text default null)
returns bradox_revenda.app_role
language sql
immutable
as $$
  select case
    when lower(coalesce(user_email, '')) = 'thebragafuture@gmail.com' then 'admin'::bradox_revenda.app_role
    when lower(nullif(trim(coalesce(raw_role, '')), '')) in ('super_admin', 'admin', 'administrator', 'owner', 'master', 'sys_admin') then 'admin'::bradox_revenda.app_role
    when lower(nullif(trim(coalesce(raw_role, '')), '')) in ('revenda', 'revenda_adm', 'revenda_admin', 'revendedor', 'reseller', 'reseller_admin', 'tenant_admin', 'network_admin', 'admin_revenda', 'gerente_revenda') then 'revenda'::bradox_revenda.app_role
    when lower(nullif(trim(coalesce(raw_role, '')), '')) in ('cliente', 'client', 'customer', 'usuario', 'user', 'assinante') then 'cliente'::bradox_revenda.app_role
    else 'cliente'::bradox_revenda.app_role
  end
$$;

create or replace function bradox_revenda.legacy_role_mapping_reason(raw_role text, user_email text default null)
returns text
language sql
immutable
as $$
  select case
    when lower(coalesce(user_email, '')) = 'thebragafuture@gmail.com' then 'email_override_admin'
    when nullif(trim(coalesce(raw_role, '')), '') is null then 'fallback_cliente_no_legacy_role'
    when lower(trim(raw_role)) in ('super_admin', 'admin', 'administrator', 'owner', 'master', 'sys_admin') then 'mapped_admin_from_legacy_role'
    when lower(trim(raw_role)) in ('revenda', 'revenda_adm', 'revenda_admin', 'revendedor', 'reseller', 'reseller_admin', 'tenant_admin', 'network_admin', 'admin_revenda', 'gerente_revenda') then 'mapped_revenda_from_legacy_role'
    when lower(trim(raw_role)) in ('cliente', 'client', 'customer', 'usuario', 'user', 'assinante') then 'mapped_cliente_from_legacy_role'
    else 'fallback_cliente_unknown_legacy_role'
  end
$$;

with legacy_roles as (
  select
    p.id as target_profile_id,
    p.email,
    ur.role::text as raw_role
  from bradox_revenda.profiles p
  left join network_hub.profiles lp on lp.id = p.legacy_network_hub_id
  left join network_hub.user_roles ur on ur.user_id = lp.id
  where p.legacy_network_hub_id is not null
)
update bradox_revenda.profiles p
set
  legacy_role_raw = legacy_roles.raw_role,
  legacy_role_mapping_reason = bradox_revenda.legacy_role_mapping_reason(legacy_roles.raw_role, legacy_roles.email),
  role = bradox_revenda.normalize_legacy_role(legacy_roles.raw_role, legacy_roles.email),
  updated_at = now()
from legacy_roles
where p.id = legacy_roles.target_profile_id;

update auth.users u
set raw_user_meta_data = coalesce(u.raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
  'role', p.role,
  'legacy_role_raw', p.legacy_role_raw,
  'legacy_role_mapping_reason', p.legacy_role_mapping_reason
)
from bradox_revenda.profiles p
where u.id = p.id
  and p.legacy_network_hub_id is not null;

update bradox_revenda.role_definitions
set
  description = case role
    when 'admin' then 'Administrador do sistema. Inclui legado super_admin e overrides internos aprovados.'
    when 'revenda' then 'Revenda normalizada a partir de revenda_adm/equivalentes ou cadastro atual aprovado.'
    when 'cliente' then 'Cliente final. Tambem e o fallback seguro quando o legado nao informa papel claro.'
    else description
  end,
  status = 'active',
  updated_at = now()
where role in ('admin', 'revenda', 'cliente');

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
select
  'network-hub',
  'phase2_role_mapping_normalization',
  'completed',
  now(),
  now(),
  jsonb_build_object(
    'legacy_user_roles', (select count(*) from network_hub.user_roles),
    'legacy_profiles_linked', (select count(*) from bradox_revenda.profiles where legacy_network_hub_id is not null)
  ),
  jsonb_object_agg(role::text, total),
  'Mapeamento definido: super_admin/admin equivalentes -> admin; revenda_adm/revenda/reseller equivalentes -> revenda; cliente equivalentes -> cliente; sem papel claro ou desconhecido -> cliente com legacy_role_mapping_reason para auditoria.'
from (
  select role, count(*) as total
  from bradox_revenda.profiles
  where legacy_network_hub_id is not null
  group by role
) mapped_roles
on conflict do nothing;

notify pgrst, 'reload schema';