grant usage on schema storage to anon, authenticated, service_role;
grant all on all tables in schema storage to anon, authenticated, service_role;
grant all on all sequences in schema storage to anon, authenticated, service_role;
grant all on all functions in schema storage to anon, authenticated, service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'manual-payment-receipts',
  'manual-payment-receipts',
  false,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anon can upload manual payment receipts" on storage.objects;
create policy "Anon can upload manual payment receipts"
on storage.objects
for insert
to anon
with check (bucket_id = 'manual-payment-receipts');

drop policy if exists "Authenticated can upload manual payment receipts" on storage.objects;
create policy "Authenticated can upload manual payment receipts"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'manual-payment-receipts');

drop policy if exists "Authenticated can read manual payment receipts" on storage.objects;
create policy "Authenticated can read manual payment receipts"
on storage.objects
for select
to authenticated
using (bucket_id = 'manual-payment-receipts');

drop policy if exists "Authenticated can update manual payment receipts" on storage.objects;
create policy "Authenticated can update manual payment receipts"
on storage.objects
for update
to authenticated
using (bucket_id = 'manual-payment-receipts')
with check (bucket_id = 'manual-payment-receipts');

drop policy if exists "Authenticated can delete manual payment receipts" on storage.objects;
create policy "Authenticated can delete manual payment receipts"
on storage.objects
for delete
to authenticated
using (bucket_id = 'manual-payment-receipts');