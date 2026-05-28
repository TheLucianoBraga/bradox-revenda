create or replace function bradox_revenda.save_plan(
  target_plan_id uuid default null,
  target_network_id uuid default null,
  target_server_id uuid default null,
  target_name text default null,
  target_plan_type text default 'cliente',
  target_price numeric default 0,
  target_credits integer default 0,
  target_duration_days integer default 30,
  target_status text default 'active'
)
returns bradox_revenda.plans
language plpgsql
security definer
set search_path = bradox_revenda, public, auth
as $$
declare
  current_profile bradox_revenda.profiles%rowtype;
  resolved_network_id uuid;
  saved_plan bradox_revenda.plans%rowtype;
  normalized_status text;
  normalized_plan_type text;
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
    raise exception 'Rede obrigatoria para salvar plano';
  end if;

  if not (current_profile.role = 'admin' or current_profile.network_id = resolved_network_id) then
    raise exception 'Sem permissao para salvar plano nesta rede';
  end if;

  if target_server_id is not null and not exists (
    select 1 from bradox_revenda.servers
    where id = target_server_id
      and network_id = resolved_network_id
      and status <> 'inactive'
  ) then
    raise exception 'Servidor invalido para este plano';
  end if;

  if nullif(trim(coalesce(target_name, '')), '') is null then
    raise exception 'Nome do plano e obrigatorio';
  end if;

  if coalesce(target_price, 0) < 0 then
    raise exception 'Preco do plano nao pode ser negativo';
  end if;

  if coalesce(target_credits, 0) < 0 then
    raise exception 'Creditos do plano nao podem ser negativos';
  end if;

  if coalesce(target_duration_days, 0) <= 0 then
    raise exception 'Duracao do plano deve ser maior que zero';
  end if;

  normalized_status := coalesce(nullif(trim(target_status), ''), 'active');
  normalized_plan_type := coalesce(nullif(trim(target_plan_type), ''), 'cliente');

  insert into bradox_revenda.plans(
    id,
    network_id,
    server_id,
    name,
    plan_type,
    price,
    credits,
    duration_days,
    status,
    created_at,
    updated_at
  ) values (
    coalesce(target_plan_id, gen_random_uuid()),
    resolved_network_id,
    target_server_id,
    trim(target_name),
    normalized_plan_type,
    coalesce(target_price, 0),
    coalesce(target_credits, 0),
    target_duration_days,
    normalized_status,
    now(),
    now()
  )
  on conflict (id) do update set
    server_id = excluded.server_id,
    name = excluded.name,
    plan_type = excluded.plan_type,
    price = excluded.price,
    credits = excluded.credits,
    duration_days = excluded.duration_days,
    status = excluded.status,
    updated_at = now()
  returning * into saved_plan;

  return saved_plan;
end;
$$;

create or replace function bradox_revenda.delete_plan(target_plan_id uuid)
returns void
language plpgsql
security definer
set search_path = bradox_revenda, public, auth
as $$
declare
  current_profile bradox_revenda.profiles%rowtype;
  target_plan bradox_revenda.plans%rowtype;
begin
  select * into current_profile
  from bradox_revenda.profiles
  where id = auth.uid()
    and status = 'active'
  limit 1;

  select * into target_plan
  from bradox_revenda.plans
  where id = target_plan_id
  for update;

  if target_plan.id is null then
    raise exception 'Plano nao encontrado';
  end if;

  if not (current_profile.role = 'admin' or current_profile.network_id = target_plan.network_id) then
    raise exception 'Sem permissao para excluir plano';
  end if;

  update bradox_revenda.plans
  set status = 'inactive', updated_at = now()
  where id = target_plan.id;
end;
$$;

grant execute on function bradox_revenda.save_plan(uuid, uuid, uuid, text, text, numeric, integer, integer, text) to authenticated;
grant execute on function bradox_revenda.delete_plan(uuid) to authenticated;

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
  'phase8_plan_crud',
  'completed',
  now(),
  now(),
  jsonb_build_object('plans', (select count(*) from bradox_revenda.plans)),
  'Planos passam a ter CRUD real por RPC com servidor, tipo, preco, creditos, duracao e status.'
)
on conflict do nothing;

notify pgrst, 'reload schema';
