create table if not exists bradox_revenda.payment_gateway_events (
  id uuid primary key default gen_random_uuid(),
  network_id uuid not null references bradox_revenda.networks(id) on delete cascade,
  order_id uuid references bradox_revenda.orders(id) on delete set null,
  provider text not null check (provider in ('mercado_pago', 'updepix')),
  event_type text not null,
  external_id text,
  external_reference text,
  payload jsonb not null default '{}'::jsonb,
  signature_valid boolean not null default false,
  processing_status text not null default 'pending' check (processing_status in ('pending', 'processed', 'failed', 'ignored')),
  error_message text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists bradox_revenda.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  network_id uuid not null references bradox_revenda.networks(id) on delete cascade,
  order_id uuid not null references bradox_revenda.orders(id) on delete cascade,
  provider text not null check (provider in ('mercado_pago', 'updepix', 'manual')),
  provider_payment_id text,
  provider_preference_id text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'paid', 'rejected', 'cancelled', 'refunded', 'failed')),
  amount numeric(12,2) not null default 0,
  currency text not null default 'BRL',
  payer_email text,
  raw_payload jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_bradox_payment_gateway_events_provider_external_id
  on bradox_revenda.payment_gateway_events(provider, external_id)
  where external_id is not null;

create unique index if not exists uq_bradox_payment_transactions_provider_payment_id
  on bradox_revenda.payment_transactions(provider, provider_payment_id)
  where provider_payment_id is not null;

create index if not exists idx_bradox_payment_gateway_events_network_status
  on bradox_revenda.payment_gateway_events(network_id, processing_status, received_at desc);

create index if not exists idx_bradox_payment_gateway_events_order
  on bradox_revenda.payment_gateway_events(order_id);

create index if not exists idx_bradox_payment_transactions_network_status
  on bradox_revenda.payment_transactions(network_id, status, created_at desc);

create index if not exists idx_bradox_payment_transactions_order
  on bradox_revenda.payment_transactions(order_id);

alter table bradox_revenda.payment_gateway_events enable row level security;
alter table bradox_revenda.payment_transactions enable row level security;

create policy "Admin scoped all payment gateway events" on bradox_revenda.payment_gateway_events
for all to authenticated
using (bradox_revenda.current_user_is_admin())
with check (bradox_revenda.current_user_is_admin());

create policy "Revenda read own payment gateway events" on bradox_revenda.payment_gateway_events
for select to authenticated
using (
  bradox_revenda.current_profile_role() = 'revenda'
  and network_id = bradox_revenda.current_network_id()
);

create policy "Admin scoped all payment transactions" on bradox_revenda.payment_transactions
for all to authenticated
using (bradox_revenda.current_user_is_admin())
with check (bradox_revenda.current_user_is_admin());

create policy "Revenda read own payment transactions" on bradox_revenda.payment_transactions
for select to authenticated
using (
  bradox_revenda.current_profile_role() = 'revenda'
  and network_id = bradox_revenda.current_network_id()
);

create policy "Cliente read own payment transactions" on bradox_revenda.payment_transactions
for select to authenticated
using (
  bradox_revenda.current_profile_role() = 'cliente'
  and exists (
    select 1
    from bradox_revenda.orders o
    where o.id = payment_transactions.order_id
      and o.buyer_id = auth.uid()
  )
);

create or replace function bradox_revenda.register_gateway_payment_event(
  provider text,
  event_type text,
  external_id text,
  external_reference text,
  order_id uuid,
  payload jsonb,
  signature_valid boolean default false
)
returns bradox_revenda.payment_gateway_events
language plpgsql
security definer
set search_path = bradox_revenda, public
as $$
declare
  target_order bradox_revenda.orders%rowtype;
  resolved_network_id uuid;
  saved_event bradox_revenda.payment_gateway_events%rowtype;
begin
  if provider not in ('mercado_pago', 'updepix') then
    raise exception 'Provedor de pagamento invalido';
  end if;

  if order_id is not null then
    select * into target_order
    from bradox_revenda.orders
    where id = order_id
    limit 1;

    if target_order.id is null then
      raise exception 'Fatura nao encontrada para evento de pagamento';
    end if;

    resolved_network_id := target_order.network_id;
  else
    resolved_network_id := nullif(payload->>'network_id', '')::uuid;
  end if;

  if resolved_network_id is null then
    raise exception 'Evento de pagamento sem rede vinculada';
  end if;

  insert into bradox_revenda.payment_gateway_events(
    network_id,
    order_id,
    provider,
    event_type,
    external_id,
    external_reference,
    payload,
    signature_valid
  ) values (
    resolved_network_id,
    order_id,
    register_gateway_payment_event.provider,
    nullif(trim(register_gateway_payment_event.event_type), ''),
    nullif(trim(register_gateway_payment_event.external_id), ''),
    nullif(trim(register_gateway_payment_event.external_reference), ''),
    coalesce(register_gateway_payment_event.payload, '{}'::jsonb),
    coalesce(register_gateway_payment_event.signature_valid, false)
  )
  on conflict (provider, external_id) where external_id is not null do update set
    order_id = coalesce(excluded.order_id, payment_gateway_events.order_id),
    external_reference = coalesce(excluded.external_reference, payment_gateway_events.external_reference),
    payload = excluded.payload,
    signature_valid = excluded.signature_valid,
    updated_at = now()
  returning * into saved_event;

  return saved_event;
end;
$$;

create or replace function bradox_revenda.apply_gateway_payment(
  provider text,
  provider_payment_id text,
  order_id uuid,
  amount numeric,
  status text,
  payload jsonb default '{}'::jsonb,
  paid_at timestamptz default null,
  provider_preference_id text default null,
  payer_email text default null
)
returns bradox_revenda.payment_transactions
language plpgsql
security definer
set search_path = bradox_revenda, public
as $$
declare
  target_order bradox_revenda.orders%rowtype;
  normalized_status text;
  saved_transaction bradox_revenda.payment_transactions%rowtype;
begin
  if provider not in ('mercado_pago', 'updepix', 'manual') then
    raise exception 'Provedor de pagamento invalido';
  end if;

  normalized_status := case
    when status in ('approved', 'paid') then status
    when status in ('pending', 'rejected', 'cancelled', 'refunded', 'failed') then status
    else 'pending'
  end;

  select * into target_order
  from bradox_revenda.orders
  where id = order_id
  limit 1;

  if target_order.id is null then
    raise exception 'Fatura nao encontrada para pagamento';
  end if;

  if coalesce(amount, 0) <= 0 then
    raise exception 'Valor de pagamento invalido';
  end if;

  insert into bradox_revenda.payment_transactions(
    network_id,
    order_id,
    provider,
    provider_payment_id,
    provider_preference_id,
    status,
    amount,
    payer_email,
    raw_payload,
    paid_at
  ) values (
    target_order.network_id,
    target_order.id,
    apply_gateway_payment.provider,
    nullif(trim(apply_gateway_payment.provider_payment_id), ''),
    nullif(trim(apply_gateway_payment.provider_preference_id), ''),
    normalized_status,
    amount,
    nullif(trim(apply_gateway_payment.payer_email), ''),
    coalesce(apply_gateway_payment.payload, '{}'::jsonb),
    case when normalized_status in ('approved', 'paid') then coalesce(apply_gateway_payment.paid_at, now()) else null end
  )
  on conflict (provider, provider_payment_id) where provider_payment_id is not null do update set
    status = excluded.status,
    amount = excluded.amount,
    provider_preference_id = coalesce(excluded.provider_preference_id, payment_transactions.provider_preference_id),
    payer_email = coalesce(excluded.payer_email, payment_transactions.payer_email),
    raw_payload = excluded.raw_payload,
    paid_at = excluded.paid_at,
    updated_at = now()
  returning * into saved_transaction;

  if normalized_status in ('approved', 'paid') then
    update bradox_revenda.orders
    set status = 'paid',
        metadata = metadata || jsonb_build_object(
          'paid_at', saved_transaction.paid_at,
          'payment_provider', saved_transaction.provider,
          'payment_transaction_id', saved_transaction.id,
          'provider_payment_id', saved_transaction.provider_payment_id
        ),
        updated_at = now()
    where id = target_order.id;
  end if;

  return saved_transaction;
end;
$$;

drop trigger if exists tr_bradox_payment_gateway_events_updated_at on bradox_revenda.payment_gateway_events;
create trigger tr_bradox_payment_gateway_events_updated_at before update on bradox_revenda.payment_gateway_events for each row execute function bradox_revenda.set_updated_at();

drop trigger if exists tr_bradox_payment_transactions_updated_at on bradox_revenda.payment_transactions;
create trigger tr_bradox_payment_transactions_updated_at before update on bradox_revenda.payment_transactions for each row execute function bradox_revenda.set_updated_at();

grant select on bradox_revenda.payment_gateway_events to authenticated;
grant select on bradox_revenda.payment_transactions to authenticated;
grant select, insert, update on bradox_revenda.payment_gateway_events to service_role;
grant select, insert, update on bradox_revenda.payment_transactions to service_role;
grant execute on function bradox_revenda.register_gateway_payment_event(text, text, text, text, uuid, jsonb, boolean) to service_role;
grant execute on function bradox_revenda.apply_gateway_payment(text, text, uuid, numeric, text, jsonb, timestamptz, text, text) to service_role;

notify pgrst, 'reload schema';