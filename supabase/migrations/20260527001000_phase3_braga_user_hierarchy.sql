insert into bradox_revenda.user_hierarchy (
  network_id,
  parent_user_id,
  child_user_id,
  legacy_network_hub_id,
  created_at
)
select
  '5abd8d41-00d3-4438-bb1f-97f250ab23cb'::uuid,
  '80a1df27-5f63-4b06-81c5-361304f6083c'::uuid,
  p.id,
  case p.legacy_network_hub_id
    when '08c58dd7-7831-46a3-83e3-9e9b6bb20f61'::uuid then '93c3d325-8f4b-4f3a-a8ff-e9a35bb85759'::uuid
    when '5860e322-94dc-484e-82d9-053516ed9750'::uuid then 'c242370e-de14-4245-94c5-0cfeaa5542c4'::uuid
    when '6db03d82-6ff9-4a7c-ba8d-e1c37f655521'::uuid then '151d5374-9c72-425c-b7fa-ae3117533f3d'::uuid
    when '68b340be-8bd1-4fdb-b2a8-87a8fd82bf52'::uuid then '1eb97027-1bd4-4d29-b023-25aa824515af'::uuid
    when '992bf7f2-ba65-4d50-8d8b-b0427b427103'::uuid then 'ea632ea2-3b00-4c79-9119-755b96cd480a'::uuid
    when 'b09be3c9-d503-49c6-a3cf-80b9071f0188'::uuid then '748c03d0-926f-4d54-aee8-4a260f66ecf0'::uuid
    else null
  end,
  now()
from bradox_revenda.profiles p
where p.network_id = '5abd8d41-00d3-4438-bb1f-97f250ab23cb'
  and p.role = 'cliente'
  and p.status = 'active'
  and p.id <> '80a1df27-5f63-4b06-81c5-361304f6083c'
on conflict (parent_user_id, child_user_id) do update set
  network_id = excluded.network_id,
  legacy_network_hub_id = coalesce(bradox_revenda.user_hierarchy.legacy_network_hub_id, excluded.legacy_network_hub_id);

update bradox_revenda.migration_batches
set
  target_counts = target_counts || jsonb_build_object(
    'admin_child_links', (
      select count(*)
      from bradox_revenda.user_hierarchy
      where parent_user_id = '80a1df27-5f63-4b06-81c5-361304f6083c'
        and network_id = '5abd8d41-00d3-4438-bb1f-97f250ab23cb'
    )
  ),
  notes = notes || ' Hierarquia Braga conectada ao admin novo como pai.'
where batch_name = 'phase3_braga_profiles';

notify pgrst, 'reload schema';