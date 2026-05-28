create or replace function bradox_revenda.create_credit_invoice(
  target_network_id uuid,
  target_server_id uuid,
  panel_username text,
  credit_quantity integer,
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
  target_server bradox_revenda.servers%rowtype;
  invoice_amount numeric(12,2);
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

  if target_network_id is null then
    raise exception 'Rede obrigatoria para comprar creditos';
  end if;

  if not (current_profile.role = 'admin' or current_profile.network_id = target_network_id) then
    raise exception 'Sem permissao para comprar creditos nesta rede';
  end if;

  select * into target_server
  from bradox_revenda.servers
  where id = target_server_id
    and network_id = target_network_id
    and status <> 'inactive'
  limit 1;

  if target_server.id is null then
    raise exception 'Servidor invalido para compra de creditos';
  end if;

  if nullif(trim(coalesce(panel_username, '')), '') is null then
    raise exception 'Usuario do painel e obrigatorio';
  end if;

  if coalesce(credit_quantity, 0) <= 0 then
    raise exception 'Quantidade de creditos deve ser maior que zero';
  end if;

  if target_server.billing_type = 'prepaid' and credit_quantity < target_server.minimum_credits then
    raise exception 'Quantidade minima para este servidor e % creditos', target_server.minimum_credits;
  end if;

  if coalesce(target_server.credit_price, 0) <= 0 then
    raise exception 'Valor por credito nao configurado para este servidor';
  end if;

  invoice_amount := credit_quantity * target_server.credit_price;

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
    target_network_id,
    current_profile.id,
    null,
    'awaiting_payment',
    'creditos',
    invoice_amount,
    jsonb_build_object(
      'customer_name', coalesce(current_profile.full_name, current_profile.email),
      'customer_email', current_profile.email,
      'customer_phone', current_profile.phone,
      'plan_name', 'Compra de creditos - ' || target_server.name,
      'server_id', target_server.id,
      'server_name', target_server.name,
      'billing_type', target_server.billing_type,
      'panel_username', trim(panel_username),
      'credit_quantity', credit_quantity,
      'unit_price', target_server.credit_price,
      'table_price', invoice_amount,
      'effective_price', invoice_amount,
      'discount_amount', 0,
      'has_custom_price', false,
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
    coalesce(pl.name, o.metadata->>'plan_name', case when o.order_type = 'creditos' then 'Compra de creditos' else 'Plano' end) as plan_name,
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

grant execute on function bradox_revenda.create_credit_invoice(uuid, uuid, text, integer, date, text) to authenticated;
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
  'phase9_credit_invoice_flow',
  'completed',
  now(),
  now(),
  jsonb_build_object('orders', (select count(*) from bradox_revenda.orders)),
  'Compra de creditos passa a gerar fatura real usando servidores, quantidade, usuario do painel e valor por credito.'
)
on conflict do nothing;

notify pgrst, 'reload schema';
