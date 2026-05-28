#!/bin/sh
set -eu

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  <<SQL
create schema if not exists auth;
create schema if not exists storage;
create schema if not exists _realtime;

do \$\$
begin
  if not exists (select from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
  if not exists (select from pg_roles where rolname = 'authenticator') then
    create role authenticator noinherit login password '$POSTGRES_PASSWORD';
  end if;
  if not exists (select from pg_roles where rolname = 'supabase_auth_admin') then
    create role supabase_auth_admin noinherit login password '$POSTGRES_PASSWORD';
  end if;
  if not exists (select from pg_roles where rolname = 'supabase_admin') then
    create role supabase_admin noinherit login password '$POSTGRES_PASSWORD';
  end if;
  if not exists (select from pg_roles where rolname = 'supabase_storage_admin') then
    create role supabase_storage_admin noinherit login password '$POSTGRES_PASSWORD';
  end if;
end \$\$;

grant anon, authenticated, service_role to authenticator;
grant usage, create on schema public to supabase_auth_admin;
grant all on schema public to supabase_auth_admin;
grant usage on schema auth to supabase_auth_admin;
grant all on schema auth to supabase_auth_admin;
grant usage on schema _realtime to supabase_admin;
grant all on schema _realtime to supabase_admin;
grant usage, create on schema storage to supabase_storage_admin;
grant all on schema storage to supabase_storage_admin;
grant usage on schema storage to anon, authenticated, service_role;
grant anon to supabase_storage_admin;
grant authenticated to supabase_storage_admin;
grant service_role to supabase_storage_admin;
alter default privileges for role supabase_storage_admin in schema storage grant all on tables to anon, authenticated, service_role;
alter default privileges for role supabase_storage_admin in schema storage grant all on sequences to anon, authenticated, service_role;
alter default privileges for role supabase_storage_admin in schema storage grant all on functions to anon, authenticated, service_role;
SQL