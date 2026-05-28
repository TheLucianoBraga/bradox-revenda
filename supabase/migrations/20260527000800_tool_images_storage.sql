grant usage on schema storage to anon, authenticated, service_role;
grant all on all tables in schema storage to anon, authenticated, service_role;
grant all on all sequences in schema storage to anon, authenticated, service_role;
grant all on all functions in schema storage to anon, authenticated, service_role;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'supabase_storage_admin') then
    grant anon to supabase_storage_admin;
    grant authenticated to supabase_storage_admin;
    grant service_role to supabase_storage_admin;
  end if;
end
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tool-images',
  'tool-images',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can read tool images" on storage.objects;
create policy "Users can read tool images"
on storage.objects
for select
to public
using (bucket_id = 'tool-images');

drop policy if exists "Users can upload own tool images" on storage.objects;
create policy "Users can upload own tool images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'tool-images');

drop policy if exists "Users can update own tool images" on storage.objects;
create policy "Users can update own tool images"
on storage.objects
for update
to authenticated
using (bucket_id = 'tool-images')
with check (bucket_id = 'tool-images');

drop policy if exists "Users can delete own tool images" on storage.objects;
create policy "Users can delete own tool images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'tool-images');