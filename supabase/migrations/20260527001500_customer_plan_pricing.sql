create table if not exists bradox_revenda.customer_plan_assignments (
  id uuid primary key default gen_random_uuid(),
  network_id uuid not null references bradox_revenda.networks(id) on delete cascade,
  customer_id uuid not null references bradox_revenda.profiles(id) on delete cascade,
  server_id uuid references bradox_revenda.servers(id) on delete set null,
  plan_id uuid not null references bradox_revenda.plans(id) on delete cascade,
  custom_price numeric(12,2),
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_id, plan_id)
);

create index if not exists idx_bradox_customer_plan_assignments_network on bradox_revenda.customer_plan_assignments(network_id);
create index if not exists idx_bradox_customer_plan_assignments_customer on bradox_revenda.customer_plan_assignments(customer_id);
create index if not exists idx_bradox_customer_plan_assignments_plan on bradox_revenda.customer_plan_assignments(plan_id);

alter table bradox_revenda.customer_plan_assignments enable row level security;

drop policy if exists "Network scoped read customer plan assignments" on bradox_revenda.customer_plan_assignments;
create policy "Network scoped read customer plan assignments" on bradox_revenda.customer_plan_assignments
for select to authenticated
using (
  bradox_revenda.current_user_is_admin()
  or network_id = bradox_revenda.current_network_id()
  or customer_id = auth.uid()
);

drop policy if exists "Network scoped manage customer plan assignments" on bradox_revenda.customer_plan_assignments;
create policy "Network scoped manage customer plan assignments" on bradox_revenda.customer_plan_assignments
for all to authenticated
using (bradox_revenda.current_user_is_admin() or network_id = bradox_revenda.current_network_id())
with check (bradox_revenda.current_user_is_admin() or network_id = bradox_revenda.current_network_id());

drop trigger if exists tr_bradox_customer_plan_assignments_updated_at on bradox_revenda.customer_plan_assignments;
create trigger tr_bradox_customer_plan_assignments_updated_at
before update on bradox_revenda.customer_plan_assignments
for each row execute function bradox_revenda.set_updated_at();

create or replace view bradox_revenda.customer_plan_price_directory as
select
  cpa.id,
  cpa.network_id,
  cpa.customer_id,
  coalesce(customer.full_name, customer.email, 'Cliente sem nome') as customer_name,
  cpa.server_id,
  server.name as server_name,
  cpa.plan_id,
  plan.name as plan_name,
  plan.plan_type,
  plan.price as table_price,
  cpa.custom_price,
  coalesce(cpa.custom_price, plan.price) as effective_price,
  greatest(plan.price - coalesce(cpa.custom_price, plan.price), 0)::numeric(12,2) as discount_amount,
  case when cpa.custom_price is not null and cpa.custom_price <> plan.price then true else false end as has_custom_price,
  cpa.status,
  cpa.created_at,
  cpa.updated_at
from bradox_revenda.customer_plan_assignments cpa
join bradox_revenda.profiles customer on customer.id = cpa.customer_id
join bradox_revenda.plans plan on plan.id = cpa.plan_id
left join bradox_revenda.servers server on server.id = cpa.server_id
where customer.role = 'cliente';

grant select on bradox_revenda.customer_plan_price_directory to authenticated;
grant all on bradox_revenda.customer_plan_assignments to authenticated, service_role;
grant usage, select on all sequences in schema bradox_revenda to authenticated, service_role;

create or replace function bradox_revenda.save_customer_plan_assignments(
  target_customer_id uuid,
  assignments jsonb default '[]'::jsonb
)
returns setof bradox_revenda.customer_plan_price_directory
language plpgsql
security definer
set search_path = bradox_revenda, public, auth
as $$
declare
  target_customer bradox_revenda.profiles%rowtype;
  item jsonb;
  selected_plan bradox_revenda.plans%rowtype;
  selected_server_id uuid;
  selected_custom_price numeric(12,2);
begin
  if target_customer_id is null then
    raise exception 'Cliente obrigatorio';
  end if;

  select * into target_customer
  from bradox_revenda.profiles
  where id = target_customer_id
    and role = 'cliente'
    and status <> 'inactive'
  for update;

  if not found then
    raise exception 'Cliente nao encontrado';
  end if;

  if not (
    bradox_revenda.current_user_is_admin()
    or target_customer.network_id = bradox_revenda.current_network_id()
    or target_customer.id = auth.uid()
  ) then
    raise exception 'Sem permissao para alterar planos deste cliente';
  end if;

  delete from bradox_revenda.customer_plan_assignments
  where customer_id = target_customer.id;

  for item in select * from jsonb_array_elements(coalesce(assignments, '[]'::jsonb)) loop
    if nullif(item->>'plan_id', '') is null then
      continue;
    end if;

    select * into selected_plan
    from bradox_revenda.plans
    where id = (item->>'plan_id')::uuid
      and network_id = target_customer.network_id
      and status <> 'inactive';

    if not found then
      raise exception 'Plano invalido para o cliente';
    end if;

    selected_server_id := nullif(item->>'server_id', '')::uuid;
    if selected_server_id is null then
      selected_server_id := selected_plan.server_id;
    end if;

    if selected_server_id is not null and not exists (
      select 1 from bradox_revenda.servers
      where id = selected_server_id
        and network_id = target_customer.network_id
        and status <> 'inactive'
    ) then
      raise exception 'Servidor invalido para o cliente';
    end if;

    selected_custom_price := nullif(item->>'custom_price', '')::numeric(12,2);
    if selected_custom_price is not null and selected_custom_price < 0 then
      raise exception 'Valor personalizado nao pode ser negativo';
    end if;

    if selected_custom_price = selected_plan.price then
      selected_custom_price := null;
    end if;

    insert into bradox_revenda.customer_plan_assignments(
      network_id,
      customer_id,
      server_id,
      plan_id,
      custom_price,
      status,
      created_at,
      updated_at
    ) values (
      target_customer.network_id,
      target_customer.id,
      selected_server_id,
      selected_plan.id,
      selected_custom_price,
      coalesce(nullif(item->>'status', ''), 'active'),
      now(),
      now()
    )
    on conflict (customer_id, plan_id) do update set
      server_id = excluded.server_id,
      custom_price = excluded.custom_price,
      status = excluded.status,
      updated_at = now();
  end loop;

  return query
  select *
  from bradox_revenda.customer_plan_price_directory
  where customer_id = target_customer.id
  order by plan_name;
end;
$$;

grant execute on function bradox_revenda.save_customer_plan_assignments(uuid, jsonb) to authenticated;

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
  'phase8_customer_plan_pricing',
  'completed',
  now(),
  now(),
  jsonb_build_object('customer_plan_assignments', (select count(*) from bradox_revenda.customer_plan_assignments)),
  'Criada base para vincular cliente a servidores/planos com preco personalizado por cliente, mantendo o preco tabelado como padrao.'
)
on conflict do nothing;

notify pgrst, 'reload schema';
