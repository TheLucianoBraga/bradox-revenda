-- Rebalance ACL after emergency admin-only lock.
-- Goal: preserve admin isolation while restoring legacy-style access for revenda/cliente.

-- Networks: authenticated users can read only their own network, admins can read all.
drop policy if exists "Admin read networks only" on bradox_revenda.networks;
create policy "Network read own or admin" on bradox_revenda.networks
for select to authenticated
using (
  id = bradox_revenda.current_network_id()
  or bradox_revenda.current_user_is_admin()
);

-- Servers: admin full access; revenda full access in own network; cliente read-only active servers in own network.
drop policy if exists "Admin scoped all servers" on bradox_revenda.servers;

create policy "Admin scoped all servers" on bradox_revenda.servers
for all to authenticated
using (bradox_revenda.current_user_is_admin())
with check (bradox_revenda.current_user_is_admin());

create policy "Revenda scoped all servers" on bradox_revenda.servers
for all to authenticated
using (
  bradox_revenda.current_profile_role() = 'revenda'
  and network_id = bradox_revenda.current_network_id()
)
with check (
  bradox_revenda.current_profile_role() = 'revenda'
  and network_id = bradox_revenda.current_network_id()
);

create policy "Cliente read active servers" on bradox_revenda.servers
for select to authenticated
using (
  bradox_revenda.current_profile_role() = 'cliente'
  and status = 'active'
  and network_id = bradox_revenda.current_network_id()
);

-- Plans: admin full access; revenda full access in own network; cliente read-only active plans in own network.
drop policy if exists "Admin scoped all plans" on bradox_revenda.plans;

create policy "Admin scoped all plans" on bradox_revenda.plans
for all to authenticated
using (bradox_revenda.current_user_is_admin())
with check (bradox_revenda.current_user_is_admin());

create policy "Revenda scoped all plans" on bradox_revenda.plans
for all to authenticated
using (
  bradox_revenda.current_profile_role() = 'revenda'
  and network_id = bradox_revenda.current_network_id()
)
with check (
  bradox_revenda.current_profile_role() = 'revenda'
  and network_id = bradox_revenda.current_network_id()
);

create policy "Cliente read active plans" on bradox_revenda.plans
for select to authenticated
using (
  bradox_revenda.current_profile_role() = 'cliente'
  and status = 'active'
  and network_id = bradox_revenda.current_network_id()
);

-- Orders: admin full access; revenda full access in own network; cliente can read and create only own orders.
drop policy if exists "Admin scoped all orders" on bradox_revenda.orders;

create policy "Admin scoped all orders" on bradox_revenda.orders
for all to authenticated
using (bradox_revenda.current_user_is_admin())
with check (bradox_revenda.current_user_is_admin());

create policy "Revenda scoped all orders" on bradox_revenda.orders
for all to authenticated
using (
  bradox_revenda.current_profile_role() = 'revenda'
  and network_id = bradox_revenda.current_network_id()
)
with check (
  bradox_revenda.current_profile_role() = 'revenda'
  and network_id = bradox_revenda.current_network_id()
);

create policy "Cliente read own orders" on bradox_revenda.orders
for select to authenticated
using (
  bradox_revenda.current_profile_role() = 'cliente'
  and buyer_id = auth.uid()
  and network_id = bradox_revenda.current_network_id()
);

create policy "Cliente create own orders" on bradox_revenda.orders
for insert to authenticated
with check (
  bradox_revenda.current_profile_role() = 'cliente'
  and buyer_id = auth.uid()
  and network_id = bradox_revenda.current_network_id()
);

notify pgrst, 'reload schema';
