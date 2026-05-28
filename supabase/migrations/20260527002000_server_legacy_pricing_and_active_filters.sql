alter table bradox_revenda.servers
  add column if not exists billing_type text not null default 'postpaid' check (billing_type in ('prepaid', 'postpaid')),
  add column if not exists credit_price numeric(12,2) not null default 0,
  add column if not exists minimum_credits integer not null default 0;

update bradox_revenda.servers target
set
  status = case when legacy.is_active then 'active' else 'inactive' end,
  billing_type = case when coalesce(legacy.requires_image_proof, false) then 'postpaid' else 'prepaid' end,
  credit_price = coalesce(legacy.credit_price, 0),
  minimum_credits = coalesce(legacy.min_credits, 0),
  metadata = coalesce(target.metadata, '{}'::jsonb) || jsonb_build_object(
    'credit_price', coalesce(legacy.credit_price, 0),
    'min_credits', coalesce(legacy.min_credits, 0),
    'legacy_credit_price', coalesce(legacy.credit_price, 0),
    'requires_image_proof', coalesce(legacy.requires_image_proof, false),
    'settlement_day', legacy.settlement_day
  ),
  updated_at = now()
from network_hub.servers legacy
where target.legacy_network_hub_id = legacy.id;

update bradox_revenda.servers
set
  credit_price = coalesce(nullif((metadata->>'legacy_credit_price')::numeric, 0), nullif((metadata->>'credit_price')::numeric, 0), credit_price),
  minimum_credits = coalesce(nullif((metadata->>'min_credits')::integer, 0), minimum_credits),
  billing_type = case
    when coalesce((metadata->>'requires_image_proof')::boolean, false) then 'postpaid'
    when billing_type in ('prepaid', 'postpaid') then billing_type
    else 'prepaid'
  end,
  updated_at = now()
where legacy_network_hub_id is null
  and metadata ?| array['legacy_credit_price', 'credit_price', 'min_credits', 'requires_image_proof'];

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
    coalesce(target_minimum_credits, 0),
    normalized_status,
    jsonb_build_object(
      'credit_price', coalesce(target_credit_price, 0),
      'min_credits', coalesce(target_minimum_credits, 0),
      'requires_image_proof', normalized_billing_type = 'postpaid'
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

grant execute on function bradox_revenda.save_server(uuid, uuid, text, text, text, numeric, integer, text) to authenticated;

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
  'phase8_server_legacy_pricing_and_active_filters',
  'completed',
  now(),
  now(),
  jsonb_build_object(
    'legacy_servers', (select count(*) from network_hub.servers),
    'legacy_prepaid', (select count(*) from network_hub.servers where coalesce(requires_image_proof, false) = false),
    'legacy_postpaid', (select count(*) from network_hub.servers where coalesce(requires_image_proof, false) = true)
  ),
  jsonb_build_object(
    'target_servers', (select count(*) from bradox_revenda.servers),
    'target_prepaid', (select count(*) from bradox_revenda.servers where billing_type = 'prepaid'),
    'target_postpaid', (select count(*) from bradox_revenda.servers where billing_type = 'postpaid'),
    'target_with_credit_price', (select count(*) from bradox_revenda.servers where credit_price > 0)
  ),
  'Sincroniza servidores com o legado: requires_image_proof define pos-pago, credit_price/min_credits populam valores reais e views de usuarios escondem inactive.'
)
on conflict do nothing;

notify pgrst, 'reload schema';
