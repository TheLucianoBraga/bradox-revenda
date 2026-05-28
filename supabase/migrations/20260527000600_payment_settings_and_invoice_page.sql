create table if not exists bradox_revenda.payment_provider_settings (
  id uuid primary key default gen_random_uuid(),
  network_id uuid not null references bradox_revenda.networks(id) on delete cascade,
  provider text not null check (provider in ('mercado_pago', 'updepix', 'manual')),
  status text not null default 'inactive' check (status in ('active', 'inactive')),
  display_name text not null,
  public_config jsonb not null default '{}'::jsonb,
  private_config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (network_id, provider)
);

create table if not exists bradox_revenda.manual_payment_receipts (
  id uuid primary key default gen_random_uuid(),
  network_id uuid not null references bradox_revenda.networks(id) on delete cascade,
  order_id uuid not null references bradox_revenda.orders(id) on delete cascade,
  submitted_by uuid references bradox_revenda.profiles(id) on delete set null,
  payer_name text,
  payer_document text,
  receipt_url text,
  receipt_file_name text,
  status text not null default 'pending_review' check (status in ('pending_review', 'approved', 'rejected')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table bradox_revenda.payment_provider_settings enable row level security;
alter table bradox_revenda.manual_payment_receipts enable row level security;

create policy "Network scoped all payment settings" on bradox_revenda.payment_provider_settings
for all to authenticated
using (network_id = bradox_revenda.current_network_id())
with check (network_id = bradox_revenda.current_network_id());

create policy "Network scoped all manual receipts" on bradox_revenda.manual_payment_receipts
for all to authenticated
using (network_id = bradox_revenda.current_network_id())
with check (network_id = bradox_revenda.current_network_id());

create policy "Anon can submit manual receipt by invoice" on bradox_revenda.manual_payment_receipts
for insert to anon
with check (
  exists (
    select 1
    from bradox_revenda.orders o
    where o.id = order_id
      and o.network_id = network_id
      and o.status in ('pending', 'awaiting_payment')
  )
);

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

create or replace function bradox_revenda.submit_manual_payment_receipt(
  order_id uuid,
  payer_name text,
  payer_document text,
  receipt_file_name text,
  receipt_url text,
  notes text default null
)
returns bradox_revenda.manual_payment_receipts
language plpgsql
security definer
set search_path = bradox_revenda, public
as $$
declare
  target_order bradox_revenda.orders;
  created_receipt bradox_revenda.manual_payment_receipts;
begin
  select * into target_order
  from bradox_revenda.orders
  where id = submit_manual_payment_receipt.order_id
    and status in ('pending', 'awaiting_payment')
  limit 1;

  if target_order.id is null then
    raise exception 'Fatura indisponivel para comprovante';
  end if;

  if nullif(trim(coalesce(receipt_file_name, '')), '') is null or nullif(trim(coalesce(receipt_url, '')), '') is null then
    raise exception 'Envie o comprovante para continuar';
  end if;

  insert into bradox_revenda.manual_payment_receipts(
    network_id,
    order_id,
    payer_name,
    payer_document,
    receipt_url,
    receipt_file_name,
    notes
  ) values (
    target_order.network_id,
    target_order.id,
    nullif(trim(payer_name), ''),
    nullif(trim(payer_document), ''),
    trim(receipt_url),
    trim(receipt_file_name),
    nullif(trim(notes), '')
  ) returning * into created_receipt;

  update bradox_revenda.orders
  set status = 'awaiting_manual_review', updated_at = now()
  where id = target_order.id;

  return created_receipt;
end;
$$;

create or replace function bradox_revenda.upsert_payment_provider_setting(
  provider text,
  status text,
  display_name text,
  public_config jsonb,
  private_config jsonb default '{}'::jsonb
)
returns bradox_revenda.payment_provider_settings
language plpgsql
security definer
set search_path = bradox_revenda, public
as $$
declare
  current_profile bradox_revenda.profiles;
  saved_setting bradox_revenda.payment_provider_settings;
begin
  select * into current_profile
  from bradox_revenda.profiles
  where id = auth.uid()
  limit 1;

  if current_profile.id is null or current_profile.network_id is null then
    raise exception 'Perfil sem rede vinculada';
  end if;

  if current_profile.role <> 'admin' then
    raise exception 'Apenas administradores podem alterar integracoes';
  end if;

  insert into bradox_revenda.payment_provider_settings(
    network_id,
    provider,
    status,
    display_name,
    public_config,
    private_config
  ) values (
    current_profile.network_id,
    upsert_payment_provider_setting.provider,
    upsert_payment_provider_setting.status,
    upsert_payment_provider_setting.display_name,
    coalesce(upsert_payment_provider_setting.public_config, '{}'::jsonb),
    coalesce(upsert_payment_provider_setting.private_config, '{}'::jsonb)
  )
  on conflict (network_id, provider) do update set
    status = excluded.status,
    display_name = excluded.display_name,
    public_config = excluded.public_config,
    private_config = excluded.private_config,
    updated_at = now()
  returning * into saved_setting;

  return saved_setting;
end;
$$;

drop trigger if exists tr_bradox_payment_provider_settings_updated_at on bradox_revenda.payment_provider_settings;
create trigger tr_bradox_payment_provider_settings_updated_at before update on bradox_revenda.payment_provider_settings for each row execute function bradox_revenda.set_updated_at();

drop trigger if exists tr_bradox_manual_payment_receipts_updated_at on bradox_revenda.manual_payment_receipts;
create trigger tr_bradox_manual_payment_receipts_updated_at before update on bradox_revenda.manual_payment_receipts for each row execute function bradox_revenda.set_updated_at();

grant select, insert, update on bradox_revenda.payment_provider_settings to authenticated, service_role;
grant select, insert, update on bradox_revenda.manual_payment_receipts to authenticated, service_role;
grant insert on bradox_revenda.manual_payment_receipts to anon;
grant execute on function bradox_revenda.get_invoice_page(uuid) to anon, authenticated, service_role;
grant execute on function bradox_revenda.submit_manual_payment_receipt(uuid, text, text, text, text, text) to anon, authenticated, service_role;
grant execute on function bradox_revenda.upsert_payment_provider_setting(text, text, text, jsonb, jsonb) to authenticated, service_role;

notify pgrst, 'reload schema';
