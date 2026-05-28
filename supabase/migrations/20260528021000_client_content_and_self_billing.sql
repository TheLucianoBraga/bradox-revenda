-- Restore client-facing content access and harden customer/credit billing ownership links.

-- Content categories: admin full, revenda full on own network, cliente read-only active on own network.
drop policy if exists "Admin scoped all content categories" on bradox_revenda.content_categories;
drop policy if exists "Network scoped read content categories" on bradox_revenda.content_categories;
drop policy if exists "Network scoped manage content categories" on bradox_revenda.content_categories;

create policy "Admin scoped all content categories" on bradox_revenda.content_categories
for all to authenticated
using (bradox_revenda.current_user_is_admin())
with check (bradox_revenda.current_user_is_admin());

create policy "Revenda scoped all content categories" on bradox_revenda.content_categories
for all to authenticated
using (
  bradox_revenda.current_profile_role() = 'revenda'
  and network_id = bradox_revenda.current_network_id()
)
with check (
  bradox_revenda.current_profile_role() = 'revenda'
  and network_id = bradox_revenda.current_network_id()
);

create policy "Cliente read active content categories" on bradox_revenda.content_categories
for select to authenticated
using (
  bradox_revenda.current_profile_role() = 'cliente'
  and status = 'active'
  and network_id = bradox_revenda.current_network_id()
);

-- Content: admin full, revenda full on own network, cliente read-only published on own network.
drop policy if exists "Admin scoped all content" on bradox_revenda.content;
drop policy if exists "Network scoped read content" on bradox_revenda.content;
drop policy if exists "Network scoped manage content" on bradox_revenda.content;

create policy "Admin scoped all content" on bradox_revenda.content
for all to authenticated
using (bradox_revenda.current_user_is_admin())
with check (bradox_revenda.current_user_is_admin());

create policy "Revenda scoped all content" on bradox_revenda.content
for all to authenticated
using (
  bradox_revenda.current_profile_role() = 'revenda'
  and network_id = bradox_revenda.current_network_id()
)
with check (
  bradox_revenda.current_profile_role() = 'revenda'
  and network_id = bradox_revenda.current_network_id()
);

create policy "Cliente read published content" on bradox_revenda.content
for select to authenticated
using (
  bradox_revenda.current_profile_role() = 'cliente'
  and status = 'published'
  and network_id = bradox_revenda.current_network_id()
);

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
  target_network bradox_revenda.networks%rowtype;
  network_owner bradox_revenda.profiles%rowtype;
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

  if current_profile.role = 'admin' then
    null;
  elsif current_profile.role = 'revenda' then
    if not (
      current_profile.network_id = target_customer.network_id
      or exists (
        select 1
        from bradox_revenda.user_hierarchy h
        where h.parent_user_id = current_profile.id
          and h.child_user_id = target_customer.id
      )
    ) then
      raise exception 'Sem permissao para cobrar este cliente';
    end if;
  elsif current_profile.role = 'cliente' then
    if current_profile.id <> target_customer.id then
      raise exception 'Cliente so pode gerar fatura para a propria conta';
    end if;
    if current_profile.network_id is distinct from target_customer.network_id then
      raise exception 'Cliente sem permissao para esta rede';
    end if;
  else
    raise exception 'Perfil sem permissao para gerar cobranca';
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

  select * into target_network
  from bradox_revenda.networks
  where id = target_customer.network_id
  limit 1;

  if target_network.id is null then
    raise exception 'Rede invalida para cobranca';
  end if;

  select * into network_owner
  from bradox_revenda.profiles
  where id = target_network.owner_id
  limit 1;

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
      'notes', nullif(trim(coalesce(notes, '')), ''),
      'network_owner_id', target_network.owner_id,
      'network_owner_name', network_owner.full_name,
      'network_owner_email', network_owner.email,
      'buyer_role', current_profile.role,
      'billing_scope', case when current_profile.id = target_customer.id then 'self' else 'managed' end
    ),
    now(),
    now()
  ) returning * into created_order;

  return created_order;
end;
$$;

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
  target_network bradox_revenda.networks%rowtype;
  network_owner bradox_revenda.profiles%rowtype;
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

  select * into target_network
  from bradox_revenda.networks
  where id = target_network_id
  limit 1;

  if target_network.id is null then
    raise exception 'Rede invalida para compra de creditos';
  end if;

  select * into network_owner
  from bradox_revenda.profiles
  where id = target_network.owner_id
  limit 1;

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
      'notes', nullif(trim(coalesce(notes, '')), ''),
      'network_owner_id', target_network.owner_id,
      'network_owner_name', network_owner.full_name,
      'network_owner_email', network_owner.email,
      'buyer_role', current_profile.role,
      'billing_scope', 'self'
    ),
    now(),
    now()
  ) returning * into created_order;

  return created_order;
end;
$$;

drop function if exists bradox_revenda.create_self_plan_invoice(uuid, date, text);
create or replace function bradox_revenda.create_self_plan_invoice(
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

  if current_profile.role <> 'cliente' then
    raise exception 'Apenas clientes podem contratar plano por esta funcao';
  end if;

  created_order := bradox_revenda.create_customer_invoice(current_profile.id, target_plan_id, due_date, notes);
  return created_order;
end;
$$;

grant execute on function bradox_revenda.create_customer_invoice(uuid, uuid, date, text) to authenticated;
grant execute on function bradox_revenda.create_credit_invoice(uuid, uuid, text, integer, date, text) to authenticated;
grant execute on function bradox_revenda.create_self_plan_invoice(uuid, date, text) to authenticated;

notify pgrst, 'reload schema';
