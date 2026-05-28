create or replace function bradox_revenda.admin_save_profile(
  profile_id uuid default null,
  target_role bradox_revenda.app_role default 'cliente',
  target_email text default null,
  target_full_name text default null,
  target_phone text default null,
  target_status text default 'active',
  target_network_id uuid default null,
  target_network_name text default null,
  target_password text default null
)
returns bradox_revenda.profiles
language plpgsql
security definer
set search_path = bradox_revenda, public, auth
as $$
declare
  saved_profile bradox_revenda.profiles%rowtype;
  normalized_email text;
  normalized_name text;
  normalized_phone text;
  normalized_status text;
  resolved_profile_id uuid;
  resolved_network_id uuid;
  requested_network text;
  existing_profile bradox_revenda.profiles%rowtype;
begin
  if not bradox_revenda.current_user_is_admin() then
    raise exception 'Apenas administradores podem gerenciar usuarios';
  end if;

  normalized_email := lower(nullif(trim(coalesce(target_email, '')), ''));
  normalized_name := nullif(trim(coalesce(target_full_name, '')), '');
  normalized_phone := nullif(trim(coalesce(target_phone, '')), '');
  normalized_status := coalesce(nullif(trim(target_status), ''), 'active');
  requested_network := nullif(trim(coalesce(target_network_name, '')), '');

  if normalized_email is null then
    raise exception 'E-mail e obrigatorio';
  end if;

  if normalized_name is null then
    normalized_name := normalized_email;
  end if;

  select * into existing_profile
  from bradox_revenda.profiles
  where id = profile_id or lower(email) = normalized_email
  order by case when id = profile_id then 0 else 1 end
  limit 1;

  resolved_profile_id := coalesce(existing_profile.id, profile_id, gen_random_uuid());

  if target_role = 'revenda' then
    if target_network_id is not null then
      resolved_network_id := target_network_id;
      update bradox_revenda.networks
      set owner_id = resolved_profile_id, updated_at = now()
      where id = resolved_network_id;
    elsif normalized_status = 'active' then
      if requested_network is null then
        raise exception 'Nome da rede e obrigatorio para revenda ativa';
      end if;

      insert into bradox_revenda.networks(name, slug, status, owner_id, created_at, updated_at)
      values (requested_network, bradox_revenda.ensure_unique_network_slug(requested_network), 'active', null, now(), now())
      returning id into resolved_network_id;
    else
      resolved_network_id := existing_profile.network_id;
    end if;
  elsif target_role = 'cliente' then
    resolved_network_id := coalesce(target_network_id, existing_profile.network_id, '5abd8d41-00d3-4438-bb1f-97f250ab23cb'::uuid);
  else
    resolved_network_id := coalesce(target_network_id, existing_profile.network_id, '5abd8d41-00d3-4438-bb1f-97f250ab23cb'::uuid);
  end if;

  insert into bradox_revenda.profiles(
    id,
    network_id,
    email,
    full_name,
    phone,
    role,
    status,
    requested_network_name,
    approved_at,
    approved_by,
    created_at,
    updated_at
  )
  values (
    resolved_profile_id,
    resolved_network_id,
    normalized_email,
    normalized_name,
    normalized_phone,
    target_role,
    normalized_status,
    case when target_role = 'revenda' then requested_network else null end,
    case when normalized_status = 'active' then now() else null end,
    case when normalized_status = 'active' then auth.uid() else null end,
    now(),
    now()
  )
  on conflict (id) do update set
    network_id = excluded.network_id,
    email = excluded.email,
    full_name = excluded.full_name,
    phone = excluded.phone,
    role = excluded.role,
    status = excluded.status,
    requested_network_name = excluded.requested_network_name,
    approved_at = coalesce(bradox_revenda.profiles.approved_at, excluded.approved_at),
    approved_by = coalesce(bradox_revenda.profiles.approved_by, excluded.approved_by),
    updated_at = now()
  returning * into saved_profile;

  if exists(select 1 from auth.users where id = saved_profile.id) then
    update auth.users
    set
      email = saved_profile.email,
      raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('full_name', saved_profile.full_name, 'phone', saved_profile.phone, 'role', saved_profile.role, 'network_name', saved_profile.requested_network_name),
      encrypted_password = case
        when nullif(target_password, '') is not null then crypt(target_password, gen_salt('bf'))
        else encrypted_password
      end,
      updated_at = now(),
      deleted_at = null,
      banned_until = null,
      confirmation_token = coalesce(confirmation_token, ''),
      recovery_token = coalesce(recovery_token, ''),
      email_change_token_new = coalesce(email_change_token_new, ''),
      email_change = coalesce(email_change, ''),
      phone_change = coalesce(phone_change, ''),
      phone_change_token = coalesce(phone_change_token, ''),
      reauthentication_token = coalesce(reauthentication_token, '')
    where id = saved_profile.id;
  else
    if nullif(target_password, '') is null then
      raise exception 'Senha temporaria e obrigatoria para criar usuario';
    end if;

    insert into auth.users(
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at,
      phone,
      phone_change,
      phone_change_token,
      email_change_token_current,
      email_change_confirm_status,
      reauthentication_token,
      is_sso_user
    )
    values (
      null,
      saved_profile.id,
      'authenticated',
      'authenticated',
      saved_profile.email,
      crypt(target_password, gen_salt('bf')),
      now(),
      '',
      '',
      '',
      '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', saved_profile.full_name, 'phone', saved_profile.phone, 'role', saved_profile.role, 'network_name', saved_profile.requested_network_name),
      false,
      now(),
      now(),
      saved_profile.phone,
      '',
      '',
      '',
      0,
      '',
      false
    );
  end if;

  if saved_profile.role = 'revenda' and saved_profile.network_id is not null then
    update bradox_revenda.networks
    set owner_id = saved_profile.id, updated_at = now()
    where id = saved_profile.network_id;
  end if;

  return saved_profile;
end;
$$;

create or replace function bradox_revenda.admin_delete_profile(profile_id uuid)
returns void
language plpgsql
security definer
set search_path = bradox_revenda, public, auth
as $$
declare
  target_profile bradox_revenda.profiles%rowtype;
begin
  if not bradox_revenda.current_user_is_admin() then
    raise exception 'Apenas administradores podem excluir usuarios';
  end if;

  select * into target_profile
  from bradox_revenda.profiles
  where id = profile_id
  for update;

  if not found then
    raise exception 'Perfil nao encontrado';
  end if;

  if target_profile.id = auth.uid() then
    raise exception 'Voce nao pode excluir o proprio usuario';
  end if;

  update bradox_revenda.profiles
  set status = 'inactive', updated_at = now()
  where id = target_profile.id;

  delete from bradox_revenda.user_hierarchy
  where parent_user_id = target_profile.id or child_user_id = target_profile.id;

  update bradox_revenda.networks
  set status = 'inactive', updated_at = now()
  where owner_id = target_profile.id;

  update auth.users
  set banned_until = 'infinity'::timestamptz, updated_at = now()
  where id = target_profile.id;
end;
$$;

grant execute on function bradox_revenda.admin_save_profile(uuid, bradox_revenda.app_role, text, text, text, text, uuid, text, text) to authenticated;
grant execute on function bradox_revenda.admin_delete_profile(uuid) to authenticated;

notify pgrst, 'reload schema';