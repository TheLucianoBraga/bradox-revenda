create or replace function bradox_revenda.create_customer_invoice(
  target_customer_id uuid,
  target_plan_id uuid,
  due_date date default null,
  notes text default null
)
returns bradox_revenda.orders
language plpgsql
security definer
set search_path = bradox_revenda, public, auth
as $$
declare
  current_profile bradox_revenda.profiles%rowtype;
  target_customer bradox_revenda.profiles%rowtype;
  target_plan bradox_revenda.plans%rowtype;
  target_assignment bradox_revenda.customer_plan_assignments%rowtype;
  invoice_amount numeric(12,2);
  discount_amount numeric(12,2);
  created_order bradox_revenda.orders%rowtype;
begin
  select * into current_profile
  from bradox_revenda.profiles
  where id = auth.uid()
    and status = 'active'
  limit 1;

  if current_profile.id is null then
    raise exception 'Perfil autenticado nao encontrado';
  end if;

  select * into target_customer
  from bradox_revenda.profiles
  where id = target_customer_id
    and role = 'cliente'
    and status <> 'inactive'
  limit 1;

  if target_customer.id is null or target_customer.network_id is null then
    raise exception 'Cliente invalido para cobranca';
  end if;

  if not (
    current_profile.role = 'admin'
    or current_profile.network_id = target_customer.network_id
    or exists (
      select 1
      from bradox_revenda.user_hierarchy h
      where h.parent_user_id = current_profile.id
        and h.child_user_id = target_customer.id
    )
  ) then
    raise exception 'Sem permissao para cobrar este cliente';
  end if;

  select * into target_plan
  from bradox_revenda.plans
  where id = target_plan_id
    and network_id = target_customer.network_id
    and status <> 'inactive'
  limit 1;

  if target_plan.id is null then
    raise exception 'Plano invalido para o cliente';
  end if;

  select * into target_assignment
  from bradox_revenda.customer_plan_assignments
  where customer_id = target_customer.id
    and plan_id = target_plan.id
    and network_id = target_customer.network_id
    and status = 'active'
  limit 1;

  invoice_amount := coalesce(target_assignment.custom_price, target_plan.price);
  discount_amount := greatest(target_plan.price - invoice_amount, 0);

  insert into bradox_revenda.orders(
    network_id,
    buyer_id,
    plan_id,
    status,
    order_type,
    amount,
    metadata,
    created_at,
    updated_at
  ) values (
    target_customer.network_id,
    target_customer.id,
    target_plan.id,
    'awaiting_payment',
    'plano',
    invoice_amount,
    jsonb_build_object(
      'customer_name', coalesce(target_customer.full_name, target_customer.email),
      'customer_email', target_customer.email,
      'customer_phone', target_customer.phone,
      'plan_name', target_plan.name,
      'server_id', coalesce(target_assignment.server_id, target_plan.server_id),
      'table_price', target_plan.price,
      'custom_price', target_assignment.custom_price,
      'effective_price', invoice_amount,
      'discount_amount', discount_amount,
      'has_custom_price', target_assignment.custom_price is not null and target_assignment.custom_price <> target_plan.price,
      'due_date', coalesce(due_date, (now() + interval '3 days')::date),
      'notes', nullif(trim(coalesce(notes, '')), '')
    ),
    now(),
    now()
  ) returning * into created_order;

  return created_order;
end;
$$;

drop function if exists bradox_revenda.get_invoice_page(uuid);

create or replace function bradox_revenda.get_invoice_page(order_id uuid)
returns table (
  id uuid,
  network_id uuid,
  network_name text,
  customer_name text,
  customer_email text,
  customer_phone text,
  plan_name text,
  amount numeric,
  table_price numeric,
  custom_price numeric,
  discount_amount numeric,
  has_custom_price boolean,
  status text,
  due_date date,
  manual_pix_key text,
  manual_pix_key_type text,
  manual_pix_receiver_name text,
  manual_pix_receiver_city text,
  manual_instructions text
)
language sql
stable
security definer
set search_path = bradox_revenda, public
as $$
  select
    o.id,
    o.network_id,
    n.name as network_name,
    coalesce(p.full_name, o.metadata->>'customer_name', 'Cliente') as customer_name,
    coalesce(p.email, o.metadata->>'customer_email') as customer_email,
    coalesce(p.phone, o.metadata->>'customer_phone') as customer_phone,
    coalesce(pl.name, o.metadata->>'plan_name', 'Plano') as plan_name,
    o.amount,
    coalesce((o.metadata->>'table_price')::numeric, pl.price, o.amount) as table_price,
    nullif(o.metadata->>'custom_price', '')::numeric as custom_price,
    coalesce((o.metadata->>'discount_amount')::numeric, greatest(coalesce(pl.price, o.amount) - o.amount, 0)) as discount_amount,
    coalesce((o.metadata->>'has_custom_price')::boolean, false) as has_custom_price,
    o.status,
    coalesce((o.metadata->>'due_date')::date, o.created_at::date) as due_date,
    ps.public_config->>'pix_key' as manual_pix_key,
    ps.public_config->>'pix_key_type' as manual_pix_key_type,
    ps.public_config->>'receiver_name' as manual_pix_receiver_name,
    ps.public_config->>'receiver_city' as manual_pix_receiver_city,
    ps.public_config->>'instructions' as manual_instructions
  from bradox_revenda.orders o
  join bradox_revenda.networks n on n.id = o.network_id
  left join bradox_revenda.profiles p on p.id = o.buyer_id
  left join bradox_revenda.plans pl on pl.id = o.plan_id
  left join bradox_revenda.payment_provider_settings ps
    on ps.network_id = o.network_id
   and ps.provider = 'manual'
   and ps.status = 'active'
  where o.id = get_invoice_page.order_id
    and o.status in ('pending', 'awaiting_payment', 'awaiting_manual_review', 'paid', 'expired', 'cancelled')
  limit 1;
$$;

grant execute on function bradox_revenda.create_customer_invoice(uuid, uuid, date, text) to authenticated;
grant execute on function bradox_revenda.get_invoice_page(uuid) to anon, authenticated, service_role;

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
  'phase9_customer_invoice_pricing',
  'completed',
  now(),
  now(),
  jsonb_build_object('orders', (select count(*) from bradox_revenda.orders)),
  'Criada geracao de fatura usando valor personalizado por cliente quando existir; pagina publica passa a expor valor de tabela, desconto e valor final.'
)
on conflict do nothing;

notify pgrst, 'reload schema';
