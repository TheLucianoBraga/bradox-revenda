insert into bradox_revenda.profiles (
  id,
  network_id,
  email,
  full_name,
  phone,
  role,
  status,
  legacy_network_hub_id,
  created_at,
  updated_at,
  approved_at
)
values
  (
    '6db03d82-6ff9-4a7c-ba8d-e1c37f655521',
    '5abd8d41-00d3-4438-bb1f-97f250ab23cb',
    'dudubraziliano535@gmail.com',
    'Carlos eduardo',
    '8179013841',
    'cliente',
    'active',
    '6db03d82-6ff9-4a7c-ba8d-e1c37f655521',
    '2026-03-30 15:00:29.624046+00',
    '2026-03-30 15:00:29.624046+00',
    '2026-03-30 15:00:29.624046+00'
  ),
  (
    '5860e322-94dc-484e-82d9-053516ed9750',
    '5abd8d41-00d3-4438-bb1f-97f250ab23cb',
    'igorgomesmascarenhas222@gmail.com',
    'Igor Gomes',
    '11987575601',
    'cliente',
    'active',
    '5860e322-94dc-484e-82d9-053516ed9750',
    '2026-03-30 15:01:48.079859+00',
    '2026-05-25 19:09:00.744862+00',
    '2026-03-30 15:01:48.079859+00'
  ),
  (
    '08c58dd7-7831-46a3-83e3-9e9b6bb20f61',
    '5abd8d41-00d3-4438-bb1f-97f250ab23cb',
    'k.u.r.a@hotmail.com',
    'ANDRE KURACIMA',
    '11919010365',
    'cliente',
    'active',
    '08c58dd7-7831-46a3-83e3-9e9b6bb20f61',
    '2026-03-31 18:06:53.609242+00',
    '2026-04-04 15:14:44.993202+00',
    '2026-03-31 18:06:53.609242+00'
  ),
  (
    '68b340be-8bd1-4fdb-b2a8-87a8fd82bf52',
    '5abd8d41-00d3-4438-bb1f-97f250ab23cb',
    'aeciofelix@gmail.com',
    'Aecio',
    '62984452877',
    'cliente',
    'active',
    '68b340be-8bd1-4fdb-b2a8-87a8fd82bf52',
    '2026-04-05 01:16:10.9404+00',
    '2026-04-12 17:48:33.135516+00',
    '2026-04-05 01:16:10.9404+00'
  ),
  (
    '992bf7f2-ba65-4d50-8d8b-b0427b427103',
    '5abd8d41-00d3-4438-bb1f-97f250ab23cb',
    'luk.bbraga@gmail.com',
    'Teste Braga',
    null,
    'cliente',
    'active',
    '992bf7f2-ba65-4d50-8d8b-b0427b427103',
    '2026-05-02 14:08:01.474717+00',
    '2026-05-12 01:07:46.491003+00',
    '2026-05-02 14:08:01.474717+00'
  ),
  (
    'b09be3c9-d503-49c6-a3cf-80b9071f0188',
    '5abd8d41-00d3-4438-bb1f-97f250ab23cb',
    'adrianoferreiracalisto2026@gmail.com',
    'Adriano Ferreira calisto',
    '65992427268',
    'cliente',
    'active',
    'b09be3c9-d503-49c6-a3cf-80b9071f0188',
    '2026-05-15 23:31:47.029978+00',
    '2026-05-18 19:29:45.727496+00',
    '2026-05-15 23:31:47.029978+00'
  )
on conflict (id) do update set
  network_id = excluded.network_id,
  email = excluded.email,
  full_name = excluded.full_name,
  phone = excluded.phone,
  role = excluded.role,
  status = excluded.status,
  legacy_network_hub_id = excluded.legacy_network_hub_id,
  updated_at = greatest(bradox_revenda.profiles.updated_at, excluded.updated_at),
  approved_at = coalesce(bradox_revenda.profiles.approved_at, excluded.approved_at);

update bradox_revenda.profiles
set
  network_id = '5abd8d41-00d3-4438-bb1f-97f250ab23cb',
  role = 'admin',
  status = 'active',
  legacy_network_hub_id = '50fe41c9-6349-4641-a28d-5cb3ae835a0e',
  updated_at = now(),
  approved_at = coalesce(approved_at, now())
where id = '80a1df27-5f63-4b06-81c5-361304f6083c'
   or lower(email) = 'thebragafuture@gmail.com';

update bradox_revenda.networks n
set
  owner_id = p.id,
  legacy_network_hub_id = '5abd8d41-00d3-4438-bb1f-97f250ab23cb',
  updated_at = now()
from bradox_revenda.profiles p
where n.id = '5abd8d41-00d3-4438-bb1f-97f250ab23cb'
  and p.id = '80a1df27-5f63-4b06-81c5-361304f6083c';

insert into bradox_revenda.migration_batches (
  source_project,
  batch_name,
  status,
  started_at,
  finished_at,
  source_counts,
  target_counts,
  notes
)
values (
  'network-hub',
  'phase3_braga_profiles',
  'completed',
  now(),
  now(),
  '{"profiles": 7, "auth_users": 7, "admin_conflicts": 1}'::jsonb,
  '{"inserted_or_updated_profiles": 7, "admin_kept_new_id": 1, "clients_preserved_ids": 6}'::jsonb,
  'Admin Braga manteve o id novo 80a1df27-5f63-4b06-81c5-361304f6083c; id legado 50fe41c9-6349-4641-a28d-5cb3ae835a0e salvo em legacy_network_hub_id.'
)
on conflict do nothing;

notify pgrst, 'reload schema';