-- Execute no banco novo depois de restaurar o dump do legado em schemas de staging.
-- O script procura primeiro `network_hub.*`; se nao existir, usa `public.*`.

do $$
declare
  source_schema text;
  roles_schema text;
  batch_id uuid;
begin
  select case
    when to_regclass('network_hub.networks') is not null then 'network_hub'
    when to_regclass('public.networks') is not null then 'public'
    else null
  end into source_schema;

  if source_schema is null then
    raise exception 'Nenhuma tabela de origem encontrada: network_hub.networks ou public.networks';
  end if;

  select case
    when to_regclass(format('%I.user_roles', source_schema)) is not null then source_schema
    when to_regclass('public.user_roles') is not null then 'public'
    else null
  end into roles_schema;

  insert into bradox_revenda.migration_batches(batch_name, status, started_at, notes)
  values ('core-from-' || source_schema, 'running', now(), 'Import core Network Hub para Bradox Revenda')
  returning id into batch_id;

  create temporary table bradox_import_roles(user_id uuid primary key, role text) on commit drop;

  if roles_schema is not null then
    execute format($sql$
      insert into bradox_import_roles(user_id, role)
      select distinct on (user_id)
        user_id,
        case
          when role::text in ('admin', 'super_admin') then 'admin'
          else 'cliente'
        end
      from %I.user_roles
      order by user_id,
        case
          when role::text in ('admin', 'super_admin') then 1
          else 2
        end
    $sql$, roles_schema);
  end if;

  execute format($sql$
    insert into bradox_revenda.networks(id, name, slug, status, legacy_network_hub_id, created_at, updated_at)
    select id, name, nullif(slug, ''), 'active', id, created_at, updated_at
    from %I.networks
    on conflict (id) do update set
      name = excluded.name,
      slug = excluded.slug,
      status = excluded.status,
      legacy_network_hub_id = excluded.legacy_network_hub_id,
      updated_at = excluded.updated_at
  $sql$, source_schema);

  execute format($sql$
    insert into bradox_revenda.profiles(id, network_id, email, full_name, phone, role, status, legacy_network_hub_id, created_at, updated_at)
    select
      p.id,
      p.network_id,
      p.email,
      p.full_name,
      p.phone,
      case
        when lower(coalesce(p.email, '')) = 'thebragafuture@gmail.com' then 'admin'
        else 'cliente'
      end::bradox_revenda.app_role,
      'active',
      p.id,
      p.created_at,
      p.updated_at
    from %I.profiles p
    left join bradox_import_roles r on r.user_id = p.id
    where p.network_id in (select id from bradox_revenda.networks)
    on conflict (id) do update set
      network_id = excluded.network_id,
      email = excluded.email,
      full_name = excluded.full_name,
      role = excluded.role,
      status = excluded.status,
      legacy_network_hub_id = excluded.legacy_network_hub_id,
      updated_at = excluded.updated_at
  $sql$, source_schema);

  if to_regclass(format('%I.user_hierarchy', source_schema)) is not null then
    execute format($sql$
      insert into bradox_revenda.user_hierarchy(id, network_id, parent_user_id, child_user_id, legacy_network_hub_id, created_at)
      select
        h.id,
        child.network_id,
        h.parent_id,
        h.user_id,
        h.id,
        h.created_at
      from %I.user_hierarchy h
      join bradox_revenda.profiles child on child.id = h.user_id
      where h.parent_id is null or exists (select 1 from bradox_revenda.profiles parent where parent.id = h.parent_id)
      on conflict (id) do nothing
    $sql$, source_schema);
  end if;

  if to_regclass(format('%I.servers', source_schema)) is not null then
    execute format($sql$
      insert into bradox_revenda.servers(id, network_id, name, status, metadata, legacy_network_hub_id, created_at, updated_at)
      select
        id,
        network_id,
        name,
        case when is_active then 'active' else 'inactive' end,
        jsonb_build_object(
          'legacy_credit_price', credit_price,
          'min_credits', min_credits,
          'requires_image_proof', requires_image_proof,
          'settlement_day', settlement_day,
          'created_by', created_by
        ),
        id,
        created_at,
        updated_at
      from %I.servers
      where network_id in (select id from bradox_revenda.networks)
      on conflict (id) do update set
        name = excluded.name,
        status = excluded.status,
        metadata = excluded.metadata,
        updated_at = excluded.updated_at
    $sql$, source_schema);
  end if;

  if to_regclass(format('%I.plans', source_schema)) is not null then
    execute format($sql$
      insert into bradox_revenda.plans(id, network_id, name, plan_type, price, duration_days, status, legacy_network_hub_id, created_at, updated_at)
      select
        id,
        network_id,
        name,
        coalesce(plan_type::text, 'cliente'),
        price,
        duration_days,
        case when is_active then 'active' else 'inactive' end,
        id,
        created_at,
        updated_at
      from %I.plans
      where network_id in (select id from bradox_revenda.networks)
      on conflict (id) do update set
        name = excluded.name,
        price = excluded.price,
        duration_days = excluded.duration_days,
        status = excluded.status,
        updated_at = excluded.updated_at
    $sql$, source_schema);
  end if;

  if to_regclass(format('%I.orders', source_schema)) is not null then
    execute format($sql$
      insert into bradox_revenda.orders(id, network_id, buyer_id, plan_id, status, order_type, amount, metadata, legacy_network_hub_id, created_at, updated_at)
      select
        id,
        network_id,
        user_id,
        plan_id,
        status::text,
        order_type::text,
        total,
        jsonb_build_object('server_id', server_id, 'credit_quantity', credit_quantity, 'notes', notes),
        id,
        created_at,
        updated_at
      from %I.orders
      where network_id in (select id from bradox_revenda.networks)
      on conflict (id) do update set
        status = excluded.status,
        amount = excluded.amount,
        metadata = excluded.metadata,
        updated_at = excluded.updated_at
    $sql$, source_schema);
  end if;

  if to_regclass(format('%I.message_templates', source_schema)) is not null then
    execute format($sql$
      insert into bradox_revenda.message_templates(id, network_id, name, category, content, media, legacy_network_hub_id, created_at, updated_at)
      select
        id,
        network_id,
        name,
        template_type,
        content,
        jsonb_build_object('is_default', is_default, 'is_active', is_active, 'created_by', created_by, 'image_urls', image_urls),
        id,
        created_at,
        updated_at
      from %I.message_templates
      where network_id in (select id from bradox_revenda.networks)
      on conflict (id) do update set
        name = excluded.name,
        category = excluded.category,
        content = excluded.content,
        media = excluded.media,
        updated_at = excluded.updated_at
    $sql$, source_schema);
  end if;

  if to_regclass(format('%I.network_tool_categories', source_schema)) is not null then
    execute format($sql$
      insert into bradox_revenda.useful_link_categories(id, network_id, owner_id, name, icon, display_order, status, legacy_network_hub_id, created_at, updated_at)
      select
        id,
        network_id,
        owner_id,
        name,
        icon,
        display_order,
        case when is_active then 'active' else 'inactive' end,
        id,
        created_at,
        updated_at
      from %I.network_tool_categories
      where network_id in (select id from bradox_revenda.networks)
      on conflict (id) do update set
        network_id = excluded.network_id,
        owner_id = excluded.owner_id,
        name = excluded.name,
        icon = excluded.icon,
        display_order = excluded.display_order,
        status = excluded.status,
        legacy_network_hub_id = excluded.legacy_network_hub_id,
        updated_at = excluded.updated_at
    $sql$, source_schema);
  end if;

  if to_regclass(format('%I.network_tools', source_schema)) is not null then
    execute format($sql$
      insert into bradox_revenda.useful_links(id, network_id, category_id, owner_id, title, url, icon, image_url, display_order, status, legacy_network_hub_id, created_at, updated_at)
      select
        id,
        network_id,
        category_id,
        owner_id,
        name,
        url,
        icon,
        image_url,
        display_order,
        case when is_active then 'active' else 'inactive' end,
        id,
        created_at,
        updated_at
      from %I.network_tools
      where network_id in (select id from bradox_revenda.networks)
      on conflict (id) do update set
        network_id = excluded.network_id,
        category_id = excluded.category_id,
        owner_id = excluded.owner_id,
        title = excluded.title,
        url = excluded.url,
        icon = excluded.icon,
        image_url = excluded.image_url,
        display_order = excluded.display_order,
        status = excluded.status,
        legacy_network_hub_id = excluded.legacy_network_hub_id,
        updated_at = excluded.updated_at
    $sql$, source_schema);
  end if;

  update bradox_revenda.migration_batches
  set
    status = 'completed',
    finished_at = now(),
    target_counts = jsonb_build_object(
      'networks', (select count(*) from bradox_revenda.networks),
      'profiles', (select count(*) from bradox_revenda.profiles),
      'user_hierarchy', (select count(*) from bradox_revenda.user_hierarchy),
      'servers', (select count(*) from bradox_revenda.servers),
      'plans', (select count(*) from bradox_revenda.plans),
      'orders', (select count(*) from bradox_revenda.orders),
      'message_templates', (select count(*) from bradox_revenda.message_templates),
      'useful_link_categories', (select count(*) from bradox_revenda.useful_link_categories),
      'useful_links', (select count(*) from bradox_revenda.useful_links)
    )
  where id = batch_id;
end $$;