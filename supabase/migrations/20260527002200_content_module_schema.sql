create table if not exists bradox_revenda.content_categories (
  id uuid primary key default gen_random_uuid(),
  network_id uuid not null references bradox_revenda.networks(id) on delete cascade,
  owner_id uuid null references bradox_revenda.profiles(id) on delete set null,
  name text not null,
  icon text null default 'folder-tree',
  color text null default 'amber',
  bg text null,
  image_url text null,
  display_order integer not null default 0,
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  legacy_network_hub_id uuid null,
  legacy_owner_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (network_id, name)
);

create table if not exists bradox_revenda.content (
  id uuid primary key default gen_random_uuid(),
  network_id uuid not null references bradox_revenda.networks(id) on delete cascade,
  category_id uuid null references bradox_revenda.content_categories(id) on delete set null,
  created_by uuid null references bradox_revenda.profiles(id) on delete set null,
  title text not null,
  description text null,
  body text null,
  content_type text not null default 'comunicado' check (content_type in ('comunicado', 'tutorial', 'aplicativo', 'atualizacao')),
  content_url text null,
  video_url text null,
  images text[] not null default '{}',
  links jsonb not null default '[]'::jsonb,
  cta_text text null,
  cta_link text null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  is_featured boolean not null default false,
  published_at timestamptz null,
  legacy_network_hub_id uuid null,
  legacy_created_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_content_categories_network_status
  on bradox_revenda.content_categories(network_id, status, display_order);

create index if not exists idx_content_network_status_published
  on bradox_revenda.content(network_id, status, published_at desc);

create index if not exists idx_content_category_id
  on bradox_revenda.content(category_id);

alter table bradox_revenda.content_categories enable row level security;
alter table bradox_revenda.content enable row level security;

drop policy if exists "Network scoped read content categories" on bradox_revenda.content_categories;
create policy "Network scoped read content categories" on bradox_revenda.content_categories
for select
to authenticated
using (bradox_revenda.current_user_is_admin() or network_id = bradox_revenda.current_network_id());

drop policy if exists "Network scoped manage content categories" on bradox_revenda.content_categories;
create policy "Network scoped manage content categories" on bradox_revenda.content_categories
for all
to authenticated
using (bradox_revenda.current_user_is_admin() or network_id = bradox_revenda.current_network_id())
with check (bradox_revenda.current_user_is_admin() or network_id = bradox_revenda.current_network_id());

drop policy if exists "Network scoped read content" on bradox_revenda.content;
create policy "Network scoped read content" on bradox_revenda.content
for select
to authenticated
using (bradox_revenda.current_user_is_admin() or network_id = bradox_revenda.current_network_id());

drop policy if exists "Network scoped manage content" on bradox_revenda.content;
create policy "Network scoped manage content" on bradox_revenda.content
for all
to authenticated
using (bradox_revenda.current_user_is_admin() or network_id = bradox_revenda.current_network_id())
with check (bradox_revenda.current_user_is_admin() or network_id = bradox_revenda.current_network_id());

grant select, insert, update, delete on bradox_revenda.content_categories to authenticated;
grant select, insert, update, delete on bradox_revenda.content to authenticated;
grant all on bradox_revenda.content_categories to service_role;
grant all on bradox_revenda.content to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'content-images',
  'content-images',
  true,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can read content images" on storage.objects;
create policy "Users can read content images"
on storage.objects
for select
to public
using (bucket_id = 'content-images');

drop policy if exists "Users can upload content images" on storage.objects;
create policy "Users can upload content images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'content-images');

drop policy if exists "Users can update content images" on storage.objects;
create policy "Users can update content images"
on storage.objects
for update
to authenticated
using (bucket_id = 'content-images')
with check (bucket_id = 'content-images');

drop policy if exists "Users can delete content images" on storage.objects;
create policy "Users can delete content images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'content-images');

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
  'network-hub',
  'phase_content_module_schema',
  'completed',
  now(),
  now(),
  jsonb_build_object(
    'content_categories_table', to_regclass('bradox_revenda.content_categories')::text,
    'content_table', to_regclass('bradox_revenda.content')::text,
    'content_images_bucket', 'content-images'
  ),
  'Schema isolado de conteudos/categorias criado no bradox_revenda, com suporte a midia, links, status e destaque.'
)
on conflict do nothing;

notify pgrst, 'reload schema';
