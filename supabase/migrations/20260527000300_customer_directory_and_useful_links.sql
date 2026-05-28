create table if not exists bradox_revenda.useful_link_categories (
  id uuid primary key default gen_random_uuid(),
  network_id uuid not null references bradox_revenda.networks(id) on delete cascade,
  owner_id uuid references bradox_revenda.profiles(id) on delete set null,
  name text not null,
  icon text,
  display_order integer not null default 0,
  status text not null default 'active',
  legacy_network_hub_id uuid unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists bradox_revenda.useful_links (
  id uuid primary key default gen_random_uuid(),
  network_id uuid not null references bradox_revenda.networks(id) on delete cascade,
  category_id uuid references bradox_revenda.useful_link_categories(id) on delete set null,
  owner_id uuid references bradox_revenda.profiles(id) on delete set null,
  title text not null,
  url text not null,
  icon text,
  image_url text,
  display_order integer not null default 0,
  status text not null default 'active',
  legacy_network_hub_id uuid unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint useful_links_url_http check (url ~* '^https?://')
);

create index if not exists idx_bradox_useful_link_categories_network on bradox_revenda.useful_link_categories(network_id);
create index if not exists idx_bradox_useful_links_network on bradox_revenda.useful_links(network_id);
create index if not exists idx_bradox_useful_links_category on bradox_revenda.useful_links(category_id);

drop trigger if exists tr_bradox_useful_link_categories_updated_at on bradox_revenda.useful_link_categories;
create trigger tr_bradox_useful_link_categories_updated_at
before update on bradox_revenda.useful_link_categories
for each row execute function bradox_revenda.set_updated_at();

drop trigger if exists tr_bradox_useful_links_updated_at on bradox_revenda.useful_links;
create trigger tr_bradox_useful_links_updated_at
before update on bradox_revenda.useful_links
for each row execute function bradox_revenda.set_updated_at();

alter table bradox_revenda.useful_link_categories enable row level security;
alter table bradox_revenda.useful_links enable row level security;

drop policy if exists "Public read Braga useful link categories" on bradox_revenda.useful_link_categories;
create policy "Public read Braga useful link categories" on bradox_revenda.useful_link_categories
for select to anon
using (
  status = 'active'
  and network_id = '5abd8d41-00d3-4438-bb1f-97f250ab23cb'::uuid
);

drop policy if exists "Public read Braga useful links" on bradox_revenda.useful_links;
create policy "Public read Braga useful links" on bradox_revenda.useful_links
for select to anon
using (
  status = 'active'
  and network_id = '5abd8d41-00d3-4438-bb1f-97f250ab23cb'::uuid
);

drop policy if exists "Network scoped all useful link categories" on bradox_revenda.useful_link_categories;
create policy "Network scoped all useful link categories" on bradox_revenda.useful_link_categories
for all to authenticated
using (network_id = bradox_revenda.current_network_id())
with check (network_id = bradox_revenda.current_network_id());

drop policy if exists "Network scoped all useful links" on bradox_revenda.useful_links;
create policy "Network scoped all useful links" on bradox_revenda.useful_links
for all to authenticated
using (network_id = bradox_revenda.current_network_id())
with check (network_id = bradox_revenda.current_network_id());

grant select on bradox_revenda.useful_link_categories to anon;
grant select on bradox_revenda.useful_links to anon;
grant all on bradox_revenda.useful_link_categories to authenticated, service_role;
grant all on bradox_revenda.useful_links to authenticated, service_role;

drop view if exists bradox_revenda.public_revendas;
drop view if exists bradox_revenda.customer_directory;

create or replace view bradox_revenda.customer_directory as
select
  p.id,
  p.network_id,
  n.name as network_name,
  coalesce(nullif(trim(p.full_name), ''), split_part(p.email, '@', 1)) as full_name,
  p.email,
  p.phone,
  p.role,
  p.status,
  p.created_at,
  0::integer as linked_customers_count
from bradox_revenda.profiles p
left join bradox_revenda.networks n on n.id = p.network_id
where p.role = 'cliente'
  and p.network_id = '5abd8d41-00d3-4438-bb1f-97f250ab23cb'::uuid;

grant select on bradox_revenda.customer_directory to anon, authenticated;

notify pgrst, 'reload schema';