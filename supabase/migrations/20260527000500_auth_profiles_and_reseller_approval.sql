alter table bradox_revenda.networks
  add column if not exists owner_id uuid references bradox_revenda.profiles(id) on delete set null;

alter table bradox_revenda.profiles
  add column if not exists requested_network_name text,
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references bradox_revenda.profiles(id) on delete set null;

create extension if not exists unaccent;

create index if not exists idx_bradox_networks_owner on bradox_revenda.networks(owner_id);
create index if not exists idx_bradox_profiles_role_status on bradox_revenda.profiles(role, status);

create or replace function bradox_revenda.slugify(value text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(unaccent(coalesce(value, ''))), '[^a-z0-9]+', '-', 'g'))
$$;

create or replace function bradox_revenda.current_profile_role()
returns bradox_revenda.app_role
language sql
stable
security definer
set search_path = bradox_revenda, public, auth
as $$
  select role from bradox_revenda.profiles where id = auth.uid()
$$;

create or replace function bradox_revenda.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = bradox_revenda, public, auth
as $$
  select exists(select 1 from bradox_revenda.profiles where id = auth.uid() and role = 'admin' and status = 'active')
$$;

drop policy if exists "Users can read own profile" on bradox_revenda.profiles;
create policy "Users can read visible profiles" on bradox_revenda.profiles
for select to authenticated
using (
  id = auth.uid()
  or network_id = bradox_revenda.current_network_id()
  or bradox_revenda.current_user_is_admin()
);

drop policy if exists "Users can update own pending profile" on bradox_revenda.profiles;
create policy "Users can update own pending profile" on bradox_revenda.profiles
for update to authenticated
using (id = auth.uid() and status in ('pending_approval', 'active'))
with check (id = auth.uid());

drop policy if exists "Admin can update users" on bradox_revenda.profiles;
create policy "Admin can update users" on bradox_revenda.profiles
for update to authenticated
using (bradox_revenda.current_user_is_admin())
with check (bradox_revenda.current_user_is_admin());

create or replace function bradox_revenda.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = bradox_revenda, public, auth
as $$
declare
  requested_role bradox_revenda.app_role;
  requested_network text;
  profile_status text;
begin
  requested_role := coalesce((new.raw_user_meta_data ->> 'role')::bradox_revenda.app_role, 'cliente');
  requested_network := nullif(trim(new.raw_user_meta_data ->> 'network_name'), '');

  if lower(new.email) = 'thebragafuture@gmail.com' then
    requested_role := 'admin';
    profile_status := 'active';
  elsif requested_role = 'revenda' then
    if requested_network is null then
      raise exception 'Nome da rede e obrigatorio para cadastro de revenda';
    end if;
    profile_status := 'pending_approval';
  else
    profile_status := 'active';
  end if;

  insert into bradox_revenda.profiles(id, email, full_name, phone, role, status, requested_network_name, created_at, updated_at)
  values (
    new.id,
    lower(new.email),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', new.email)), ''),
    nullif(trim(new.raw_user_meta_data ->> 'phone'), ''),
    requested_role,
    profile_status,
    requested_network,
    now(),
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(bradox_revenda.profiles.full_name, excluded.full_name),
    phone = coalesce(bradox_revenda.profiles.phone, excluded.phone),
    role = excluded.role,
    status = case when bradox_revenda.profiles.status = 'active' then bradox_revenda.profiles.status else excluded.status end,
    requested_network_name = coalesce(bradox_revenda.profiles.requested_network_name, excluded.requested_network_name),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists tr_bradox_auth_user_profile on auth.users;
create trigger tr_bradox_auth_user_profile
after insert on auth.users
for each row execute function bradox_revenda.handle_new_auth_user();

create or replace function bradox_revenda.ensure_unique_network_slug(network_name text)
returns text
language plpgsql
security definer
set search_path = bradox_revenda, public
as $$
declare
  base_slug text;
  candidate text;
  suffix integer := 1;
begin
  base_slug := nullif(bradox_revenda.slugify(network_name), '');
  if base_slug is null then
    base_slug := 'rede';
  end if;

  candidate := base_slug;
  while exists(select 1 from bradox_revenda.networks where slug = candidate) loop
    suffix := suffix + 1;
    candidate := base_slug || '-' || suffix::text;
  end loop;

  return candidate;
end;
$$;

create or replace function bradox_revenda.approve_reseller_profile(profile_id uuid)
returns bradox_revenda.profiles
language plpgsql
security definer
set search_path = bradox_revenda, public, auth
as $$
declare
  target_profile bradox_revenda.profiles%rowtype;
  created_network_id uuid;
begin
  if not bradox_revenda.current_user_is_admin() then
    raise exception 'Apenas administradores podem aprovar revendas';
  end if;

  select * into target_profile
  from bradox_revenda.profiles
  where id = profile_id
  for update;

  if not found then
    raise exception 'Perfil nao encontrado';
  end if;

  if target_profile.role <> 'revenda' then
    raise exception 'Somente perfis revenda podem ser aprovados por esta acao';
  end if;

  if nullif(trim(target_profile.requested_network_name), '') is null then
    raise exception 'Nome da rede e obrigatorio para aprovar revenda';
  end if;

  if target_profile.network_id is null then
    insert into bradox_revenda.networks(name, slug, status, owner_id)
    values (
      trim(target_profile.requested_network_name),
      bradox_revenda.ensure_unique_network_slug(target_profile.requested_network_name),
      'active',
      target_profile.id
    )
    returning id into created_network_id;
  else
    created_network_id := target_profile.network_id;
    update bradox_revenda.networks
    set owner_id = target_profile.id, updated_at = now()
    where id = created_network_id and owner_id is null;
  end if;

  update bradox_revenda.profiles
  set
    network_id = created_network_id,
    status = 'active',
    approved_at = now(),
    approved_by = auth.uid(),
    updated_at = now()
  where id = target_profile.id
  returning * into target_profile;

  return target_profile;
end;
$$;

create or replace view bradox_revenda.customer_directory as
select
  p.id,
  p.network_id,
  n.name as network_name,
  coalesce(p.full_name, p.email, 'Cliente sem nome') as full_name,
  p.email,
  p.phone,
  p.role::text::bradox_revenda.app_role as role,
  p.status,
  p.created_at,
  count(children.child_user_id)::integer as linked_customers_count
from bradox_revenda.profiles p
left join bradox_revenda.networks n on n.id = p.network_id
left join bradox_revenda.user_hierarchy children on children.parent_user_id = p.id
where p.role = 'cliente'
group by p.id, p.network_id, n.name, p.full_name, p.email, p.phone, p.role, p.status, p.created_at;

create or replace view bradox_revenda.reseller_directory as
select
  p.id,
  p.network_id,
  n.name as network_name,
  n.slug as network_slug,
  coalesce(p.full_name, p.email, 'Revenda sem nome') as full_name,
  p.email,
  p.phone,
  p.role,
  p.status,
  p.requested_network_name,
  p.approved_at,
  p.created_at
from bradox_revenda.profiles p
left join bradox_revenda.networks n on n.id = p.network_id
where p.role = 'revenda';

grant select on bradox_revenda.customer_directory to anon, authenticated;
grant select on bradox_revenda.reseller_directory to authenticated;
grant execute on function bradox_revenda.approve_reseller_profile(uuid) to authenticated;

insert into bradox_revenda.networks(id, name, slug, status, created_at, updated_at)
values ('5abd8d41-00d3-4438-bb1f-97f250ab23cb', 'Braga Digital - Oficial', 'admin', 'active', now(), now())
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  status = 'active',
  updated_at = now();

update bradox_revenda.profiles
set
  network_id = '5abd8d41-00d3-4438-bb1f-97f250ab23cb',
  role = 'admin',
  status = 'active',
  updated_at = now()
where lower(email) = 'thebragafuture@gmail.com';

update bradox_revenda.networks n
set owner_id = p.id, updated_at = now()
from bradox_revenda.profiles p
where n.id = '5abd8d41-00d3-4438-bb1f-97f250ab23cb'
  and lower(p.email) = 'thebragafuture@gmail.com';

notify pgrst, 'reload schema';