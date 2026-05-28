create policy "Public read networks for staging" on bradox_revenda.networks
for select to anon
using (status = 'active');

create policy "Public read active servers for staging" on bradox_revenda.servers
for select to anon
using (status = 'active');

create policy "Public read active plans for staging" on bradox_revenda.plans
for select to anon
using (status = 'active');

create policy "Public read templates for staging" on bradox_revenda.message_templates
for select to anon
using (true);

grant select on bradox_revenda.networks to anon;
grant select on bradox_revenda.servers to anon;
grant select on bradox_revenda.plans to anon;
grant select on bradox_revenda.message_templates to anon;