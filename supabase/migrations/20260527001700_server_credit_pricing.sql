alter table bradox_revenda.servers
  add column if not exists billing_type text not null default 'postpaid' check (billing_type in ('prepaid', 'postpaid')),
  add column if not exists credit_price numeric(12,2) not null default 0,
  add column if not exists minimum_credits integer not null default 0;

update bradox_revenda.servers
set
  minimum_credits = coalesce(nullif((metadata->>'min_credits')::integer, 0), minimum_credits),
  credit_price = coalesce(nullif((metadata->>'credit_price')::numeric, 0), credit_price),
  billing_type = case
    when coalesce(nullif((metadata->>'min_credits')::integer, 0), minimum_credits, 0) > 0 then 'prepaid'
    else billing_type
  end
where metadata ? 'min_credits' or metadata ? 'credit_price';

update bradox_revenda.customer_plan_assignments cpa
set custom_price = null, updated_at = now()
from bradox_revenda.plans p
where p.id = cpa.plan_id
  and cpa.custom_price = p.price;

create or replace function bradox_revenda.save_server(
  target_server_id uuid default null,
  target_network_id uuid default null,
  target_name text default null,
  target_base_url text default null,
  target_billing_type text default 'postpaid',
  target_credit_price numeric default 0,
  target_minimum_credits integer default 0,
  target_status text default 'active'
)
returns bradox_revenda.servers
language plpgsql
security definer
set search_path = bradox_revenda, public, auth
as $$
declare
  current_profile bradox_revenda.profiles%rowtype;
  resolved_network_id uuid;
  saved_server bradox_revenda.servers%rowtype;
  normalized_billing_type text;
  normalized_status text;
begin
  select * into current_profile
  from bradox_revenda.profiles
  where id = auth.uid()
    and status = 'active'
  limit 1;

  if current_profile.id is null then
    raise exception 'Perfil autenticado nao encontrado';
  end if;

  resolved_network_id := coalesce(target_network_id, current_profile.network_id);
  if resolved_network_id is null then
    raise exception 'Rede obrigatoria para salvar servidor';
  end if;

  if not (current_profile.role = 'admin' or current_profile.network_id = resolved_network_id) then
    raise exception 'Sem permissao para salvar servidor nesta rede';
  end if;

  normalized_billing_type := coalesce(nullif(trim(target_billing_type), ''), 'postpaid');
  if normalized_billing_type not in ('prepaid', 'postpaid') then
    raise exception 'Tipo de cobranca invalido';
  end if;

  normalized_status := coalesce(nullif(trim(target_status), ''), 'active');

  if nullif(trim(coalesce(target_name, '')), '') is null then
    raise exception 'Nome do servidor e obrigatorio';
  end if;

  if coalesce(target_credit_price, 0) < 0 then
    raise exception 'Valor por credito nao pode ser negativo';
  end if;

  if coalesce(target_minimum_credits, 0) < 0 then
    raise exception 'Quantidade minima nao pode ser negativa';
  end if;

  insert into bradox_revenda.servers(
    id,
    network_id,
    name,
    base_url,
    billing_type,
    credit_price,
    minimum_credits,
    status,
    metadata,
    created_at,
    updated_at
  ) values (
    coalesce(target_server_id, gen_random_uuid()),
    resolved_network_id,
    trim(target_name),
    nullif(trim(coalesce(target_base_url, '')), ''),
    normalized_billing_type,
    coalesce(target_credit_price, 0),
    case when normalized_billing_type = 'prepaid' then coalesce(target_minimum_credits, 0) else 0 end,
    normalized_status,
    jsonb_build_object(
      'credit_price', coalesce(target_credit_price, 0),
      'min_credits', case when normalized_billing_type = 'prepaid' then coalesce(target_minimum_credits, 0) else 0 end
    ),
    now(),
    now()
  )
  on conflict (id) do update set
    name = excluded.name,
    base_url = excluded.base_url,
    billing_type = excluded.billing_type,
    credit_price = excluded.credit_price,
    minimum_credits = excluded.minimum_credits,
    status = excluded.status,
    metadata = coalesce(bradox_revenda.servers.metadata, '{}'::jsonb) || excluded.metadata,
    updated_at = now()
  returning * into saved_server;

  return saved_server;
end;
$$;

create or replace function bradox_revenda.delete_server(target_server_id uuid)
returns void
language plpgsql
security definer
set search_path = bradox_revenda, public, auth
as $$
declare
  current_profile bradox_revenda.profiles%rowtype;
  target_server bradox_revenda.servers%rowtype;
begin
  select * into current_profile
  from bradox_revenda.profiles
  where id = auth.uid()
    and status = 'active'
  limit 1;

  select * into target_server
  from bradox_revenda.servers
  where id = target_server_id
  for update;

  if target_server.id is null then
    raise exception 'Servidor nao encontrado';
  end if;

  if not (current_profile.role = 'admin' or current_profile.network_id = target_server.network_id) then
    raise exception 'Sem permissao para excluir servidor';
  end if;

  update bradox_revenda.servers
  set status = 'inactive', updated_at = now()
  where id = target_server.id;
end;
$$;

grant execute on function bradox_revenda.save_server(uuid, uuid, text, text, text, numeric, integer, text) to authenticated;
grant execute on function bradox_revenda.delete_server(uuid) to authenticated;

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
  'phase8_server_credit_pricing',
  'completed',
  now(),
  now(),
  jsonb_build_object('servers', (select count(*) from bradox_revenda.servers)),
  'Servidores passam a ter tipo de cobranca, valor por credito e quantidade minima; CRUD real via RPC save_server/delete_server.'
)
on conflict do nothing;

notify pgrst, 'reload schema';
