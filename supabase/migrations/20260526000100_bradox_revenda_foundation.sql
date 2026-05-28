create schema if not exists bradox_revenda;

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typnamespace = 'bradox_revenda'::regnamespace and typname = 'app_role') then
    create type bradox_revenda.app_role as enum ('admin', 'revenda', 'cliente');
  end if;
end $$;

create or replace function bradox_revenda.set_updated_at()
returns trigger
language plpgsql
set search_path = bradox_revenda, public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists bradox_revenda.networks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  status text not null default 'active',
  legacy_network_hub_id uuid unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists bradox_revenda.profiles (
  id uuid primary key,
  network_id uuid references bradox_revenda.networks(id) on delete set null,
  email text,
  full_name text,
  phone text,
  role bradox_revenda.app_role not null default 'cliente',
  status text not null default 'active',
  legacy_network_hub_id uuid unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists bradox_revenda.user_hierarchy (
  id uuid primary key default gen_random_uuid(),
  network_id uuid references bradox_revenda.networks(id) on delete cascade,
  parent_user_id uuid references bradox_revenda.profiles(id) on delete cascade,
  child_user_id uuid references bradox_revenda.profiles(id) on delete cascade,
  legacy_network_hub_id uuid unique,
  created_at timestamptz not null default now(),
  unique (parent_user_id, child_user_id)
);

create table if not exists bradox_revenda.servers (
  id uuid primary key default gen_random_uuid(),
  network_id uuid not null references bradox_revenda.networks(id) on delete cascade,
  name text not null,
  base_url text,
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  legacy_network_hub_id uuid unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists bradox_revenda.plans (
  id uuid primary key default gen_random_uuid(),
  network_id uuid not null references bradox_revenda.networks(id) on delete cascade,
  server_id uuid references bradox_revenda.servers(id) on delete set null,
  name text not null,
  plan_type text not null default 'cliente',
  price numeric(12,2) not null default 0,
  credits integer not null default 0,
  duration_days integer not null default 30,
  status text not null default 'active',
  legacy_network_hub_id uuid unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists bradox_revenda.orders (
  id uuid primary key default gen_random_uuid(),
  network_id uuid not null references bradox_revenda.networks(id) on delete cascade,
  buyer_id uuid references bradox_revenda.profiles(id) on delete set null,
  plan_id uuid references bradox_revenda.plans(id) on delete set null,
  status text not null default 'pending',
  order_type text not null default 'plano',
  amount numeric(12,2) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  legacy_network_hub_id uuid unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists bradox_revenda.message_templates (
  id uuid primary key default gen_random_uuid(),
  network_id uuid not null references bradox_revenda.networks(id) on delete cascade,
  name text not null,
  category text,
  content text not null,
  media jsonb,
  legacy_network_hub_id uuid unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists bradox_revenda.migration_batches (
  id uuid primary key default gen_random_uuid(),
  source_project text not null default 'network-hub',
  batch_name text not null,
  status text not null default 'pending',
  started_at timestamptz,
  finished_at timestamptz,
  source_counts jsonb not null default '{}'::jsonb,
  target_counts jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_bradox_profiles_network on bradox_revenda.profiles(network_id);
create index if not exists idx_bradox_servers_network on bradox_revenda.servers(network_id);
create index if not exists idx_bradox_plans_network on bradox_revenda.plans(network_id);
create index if not exists idx_bradox_orders_network on bradox_revenda.orders(network_id);
create index if not exists idx_bradox_templates_network on bradox_revenda.message_templates(network_id);

alter table bradox_revenda.networks enable row level security;
alter table bradox_revenda.profiles enable row level security;
alter table bradox_revenda.user_hierarchy enable row level security;
alter table bradox_revenda.servers enable row level security;
alter table bradox_revenda.plans enable row level security;
alter table bradox_revenda.orders enable row level security;
alter table bradox_revenda.message_templates enable row level security;
alter table bradox_revenda.migration_batches enable row level security;

create or replace function bradox_revenda.current_network_id()
returns uuid
language sql
stable
security definer
set search_path = bradox_revenda, public, auth
as $$
  select network_id from bradox_revenda.profiles where id = auth.uid()
$$;

create policy "Users can read own profile" on bradox_revenda.profiles
for select to authenticated
using (id = auth.uid() or network_id = bradox_revenda.current_network_id());

create policy "Network scoped read networks" on bradox_revenda.networks
for select to authenticated
using (id = bradox_revenda.current_network_id());

create policy "Network scoped all servers" on bradox_revenda.servers
for all to authenticated
using (network_id = bradox_revenda.current_network_id())
with check (network_id = bradox_revenda.current_network_id());

create policy "Network scoped all plans" on bradox_revenda.plans
for all to authenticated
using (network_id = bradox_revenda.current_network_id())
with check (network_id = bradox_revenda.current_network_id());

create policy "Network scoped all orders" on bradox_revenda.orders
for all to authenticated
using (network_id = bradox_revenda.current_network_id())
with check (network_id = bradox_revenda.current_network_id());

create policy "Network scoped all templates" on bradox_revenda.message_templates
for all to authenticated
using (network_id = bradox_revenda.current_network_id())
with check (network_id = bradox_revenda.current_network_id());

create policy "Service role migration access" on bradox_revenda.migration_batches
for all to service_role
using (true)
with check (true);

grant usage on schema bradox_revenda to anon, authenticated, service_role;
grant all on all tables in schema bradox_revenda to authenticated, service_role;
grant usage, select on all sequences in schema bradox_revenda to authenticated, service_role;
alter default privileges in schema bradox_revenda grant all on tables to authenticated, service_role;
alter default privileges in schema bradox_revenda grant usage, select on sequences to authenticated, service_role;

drop trigger if exists tr_bradox_networks_updated_at on bradox_revenda.networks;
create trigger tr_bradox_networks_updated_at before update on bradox_revenda.networks for each row execute function bradox_revenda.set_updated_at();

drop trigger if exists tr_bradox_profiles_updated_at on bradox_revenda.profiles;
create trigger tr_bradox_profiles_updated_at before update on bradox_revenda.profiles for each row execute function bradox_revenda.set_updated_at();

drop trigger if exists tr_bradox_servers_updated_at on bradox_revenda.servers;
create trigger tr_bradox_servers_updated_at before update on bradox_revenda.servers for each row execute function bradox_revenda.set_updated_at();

drop trigger if exists tr_bradox_plans_updated_at on bradox_revenda.plans;
create trigger tr_bradox_plans_updated_at before update on bradox_revenda.plans for each row execute function bradox_revenda.set_updated_at();

drop trigger if exists tr_bradox_orders_updated_at on bradox_revenda.orders;
create trigger tr_bradox_orders_updated_at before update on bradox_revenda.orders for each row execute function bradox_revenda.set_updated_at();

drop trigger if exists tr_bradox_templates_updated_at on bradox_revenda.message_templates;
create trigger tr_bradox_templates_updated_at before update on bradox_revenda.message_templates for each row execute function bradox_revenda.set_updated_at();