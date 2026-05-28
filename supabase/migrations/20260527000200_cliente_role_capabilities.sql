create table if not exists bradox_revenda.role_definitions (
  role bradox_revenda.app_role primary key,
  label text not null,
  description text not null,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists bradox_revenda.role_capabilities (
  role bradox_revenda.app_role not null references bradox_revenda.role_definitions(role) on delete cascade,
  capability text not null,
  label text not null,
  enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (role, capability)
);

drop trigger if exists tr_bradox_role_definitions_updated_at on bradox_revenda.role_definitions;
create trigger tr_bradox_role_definitions_updated_at
before update on bradox_revenda.role_definitions
for each row execute function bradox_revenda.set_updated_at();

drop trigger if exists tr_bradox_role_capabilities_updated_at on bradox_revenda.role_capabilities;
create trigger tr_bradox_role_capabilities_updated_at
before update on bradox_revenda.role_capabilities
for each row execute function bradox_revenda.set_updated_at();

alter table bradox_revenda.role_definitions enable row level security;
alter table bradox_revenda.role_capabilities enable row level security;

drop policy if exists "Public read role definitions" on bradox_revenda.role_definitions;
create policy "Public read role definitions" on bradox_revenda.role_definitions
for select to anon, authenticated
using (true);

drop policy if exists "Public read role capabilities" on bradox_revenda.role_capabilities;
create policy "Public read role capabilities" on bradox_revenda.role_capabilities
for select to anon, authenticated
using (true);

grant select on bradox_revenda.role_definitions to anon, authenticated;
grant select on bradox_revenda.role_capabilities to anon, authenticated;
grant all on bradox_revenda.role_definitions to service_role;
grant all on bradox_revenda.role_capabilities to service_role;

insert into bradox_revenda.role_definitions(role, label, description, status)
values
  ('admin', 'Administrador', 'Operador interno da rede Braga Digital com acesso de gestao.', 'active'),
  ('cliente', 'Cliente', 'Usuario final migrado do sistema antigo, incluindo antigas revendas ate a criacao do novo role revenda.', 'active'),
  ('revenda', 'Revenda', 'Role reservado para etapa futura, com regras proprias ainda nao habilitadas.', 'reserved')
on conflict (role) do update set
  label = excluded.label,
  description = excluded.description,
  status = excluded.status;

insert into bradox_revenda.role_capabilities(role, capability, label, enabled, metadata)
values
  ('cliente', 'consume_content', 'Consumir conteudo', true, '{"source":"legacy_user"}'::jsonb),
  ('cliente', 'buy_credits', 'Comprar creditos', true, '{"source":"legacy_user"}'::jsonb),
  ('cliente', 'pay_plans', 'Pagar planos', true, '{"source":"legacy_user"}'::jsonb),
  ('admin', 'manage_network', 'Gerenciar rede Braga Digital', true, '{"scope":"braga_digital"}'::jsonb),
  ('revenda', 'reseller_rules', 'Regras de revenda futuras', false, '{"status":"reserved"}'::jsonb)
on conflict (role, capability) do update set
  label = excluded.label,
  enabled = excluded.enabled,
  metadata = excluded.metadata;

update bradox_revenda.profiles p
set role = case
  when lower(coalesce(p.email, '')) = 'thebragafuture@gmail.com' then 'admin'::bradox_revenda.app_role
  else 'cliente'::bradox_revenda.app_role
end
where p.network_id = '5abd8d41-00d3-4438-bb1f-97f250ab23cb'::uuid;

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