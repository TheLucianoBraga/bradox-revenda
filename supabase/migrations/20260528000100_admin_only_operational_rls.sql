drop policy if exists "Users can read visible profiles" on bradox_revenda.profiles;
create policy "Users can read own profile or admin" on bradox_revenda.profiles
for select to authenticated
using (
  id = auth.uid()
  or bradox_revenda.current_user_is_admin()
);

drop policy if exists "Network scoped read networks" on bradox_revenda.networks;
create policy "Admin read networks only" on bradox_revenda.networks
for select to authenticated
using (bradox_revenda.current_user_is_admin());

drop policy if exists "Network scoped all servers" on bradox_revenda.servers;
create policy "Admin scoped all servers" on bradox_revenda.servers
for all to authenticated
using (bradox_revenda.current_user_is_admin())
with check (bradox_revenda.current_user_is_admin());

drop policy if exists "Network scoped all plans" on bradox_revenda.plans;
create policy "Admin scoped all plans" on bradox_revenda.plans
for all to authenticated
using (bradox_revenda.current_user_is_admin())
with check (bradox_revenda.current_user_is_admin());

drop policy if exists "Network scoped all orders" on bradox_revenda.orders;
create policy "Admin scoped all orders" on bradox_revenda.orders
for all to authenticated
using (bradox_revenda.current_user_is_admin())
with check (bradox_revenda.current_user_is_admin());

drop policy if exists "Network scoped all templates" on bradox_revenda.message_templates;
create policy "Admin scoped all templates" on bradox_revenda.message_templates
for all to authenticated
using (bradox_revenda.current_user_is_admin())
with check (bradox_revenda.current_user_is_admin());

drop policy if exists "Network scoped all useful link categories" on bradox_revenda.useful_link_categories;
create policy "Admin scoped all useful link categories" on bradox_revenda.useful_link_categories
for all to authenticated
using (bradox_revenda.current_user_is_admin())
with check (bradox_revenda.current_user_is_admin());

drop policy if exists "Network scoped all useful links" on bradox_revenda.useful_links;
create policy "Admin scoped all useful links" on bradox_revenda.useful_links
for all to authenticated
using (bradox_revenda.current_user_is_admin())
with check (bradox_revenda.current_user_is_admin());

drop policy if exists "Network scoped all payment settings" on bradox_revenda.payment_provider_settings;
create policy "Admin scoped all payment settings" on bradox_revenda.payment_provider_settings
for all to authenticated
using (bradox_revenda.current_user_is_admin())
with check (bradox_revenda.current_user_is_admin());

drop policy if exists "Network scoped all manual receipts" on bradox_revenda.manual_payment_receipts;
create policy "Admin scoped all manual receipts" on bradox_revenda.manual_payment_receipts
for all to authenticated
using (bradox_revenda.current_user_is_admin())
with check (bradox_revenda.current_user_is_admin());

drop policy if exists "Anon can submit manual receipt by invoice" on bradox_revenda.manual_payment_receipts;
create policy "Anon can submit manual receipt by invoice" on bradox_revenda.manual_payment_receipts
for insert to anon
with check (
  exists (
    select 1
    from bradox_revenda.orders o
    where o.id = order_id
      and o.network_id = manual_payment_receipts.network_id
      and o.status in ('pending', 'awaiting_payment')
  )
);

drop policy if exists "Network scoped read content categories" on bradox_revenda.content_categories;
drop policy if exists "Network scoped manage content categories" on bradox_revenda.content_categories;
create policy "Admin scoped all content categories" on bradox_revenda.content_categories
for all to authenticated
using (bradox_revenda.current_user_is_admin())
with check (bradox_revenda.current_user_is_admin());

drop policy if exists "Network scoped read content" on bradox_revenda.content;
drop policy if exists "Network scoped manage content" on bradox_revenda.content;
create policy "Admin scoped all content" on bradox_revenda.content
for all to authenticated
using (bradox_revenda.current_user_is_admin())
with check (bradox_revenda.current_user_is_admin());

notify pgrst, 'reload schema';
