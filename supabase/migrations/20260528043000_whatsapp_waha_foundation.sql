create table if not exists bradox_revenda.whatsapp_gateway_settings (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'waha_plus' check (provider = 'waha_plus'),
  status text not null default 'inactive' check (status in ('active', 'inactive')),
  api_base_url text not null,
  api_key_secret_ref text not null default 'WAHA_PLUS_API_KEY',
  session_namespace text not null default 'bradox-revenda_',
  shared_gateway boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider)
);

create table if not exists bradox_revenda.whatsapp_sessions (
  id uuid primary key default gen_random_uuid(),
  network_id uuid not null references bradox_revenda.networks(id) on delete cascade,
  owner_profile_id uuid references bradox_revenda.profiles(id) on delete set null,
  provider text not null default 'waha_plus' check (provider = 'waha_plus'),
  external_session_name text not null,
  phone_number text,
  display_name text,
  status text not null default 'not_configured' check (status in ('not_configured', 'starting', 'qr', 'connected', 'disconnected', 'failed', 'stopped')),
  last_status_payload jsonb not null default '{}'::jsonb,
  last_seen_at timestamptz,
  connected_at timestamptz,
  disconnected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint whatsapp_sessions_namespaced check (external_session_name like 'bradox-revenda_%'),
  unique (external_session_name),
  unique (network_id, owner_profile_id)
);

create table if not exists bradox_revenda.whatsapp_webhook_events (
  id uuid primary key default gen_random_uuid(),
  network_id uuid references bradox_revenda.networks(id) on delete set null,
  session_id uuid references bradox_revenda.whatsapp_sessions(id) on delete set null,
  external_session_name text,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  processing_status text not null default 'pending' check (processing_status in ('pending', 'processed', 'failed', 'ignored')),
  error_message text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint whatsapp_webhook_events_namespaced check (external_session_name is null or external_session_name like 'bradox-revenda_%')
);

create table if not exists bradox_revenda.whatsapp_message_queue (
  id uuid primary key default gen_random_uuid(),
  network_id uuid not null references bradox_revenda.networks(id) on delete cascade,
  session_id uuid references bradox_revenda.whatsapp_sessions(id) on delete set null,
  recipient_phone text not null,
  message_type text not null default 'text' check (message_type in ('text', 'image', 'audio', 'document')),
  body text,
  media_url text,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued', 'processing', 'sent', 'failed', 'cancelled')),
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  last_error text,
  sent_at timestamptz,
  created_by uuid references bradox_revenda.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists bradox_revenda.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  network_id uuid not null references bradox_revenda.networks(id) on delete cascade,
  session_id uuid references bradox_revenda.whatsapp_sessions(id) on delete set null,
  queue_id uuid references bradox_revenda.whatsapp_message_queue(id) on delete set null,
  direction text not null check (direction in ('inbound', 'outbound')),
  remote_jid text,
  recipient_phone text,
  sender_phone text,
  message_type text not null default 'text',
  body text,
  media_url text,
  provider_message_id text,
  status text not null default 'received' check (status in ('queued', 'sent', 'delivered', 'read', 'received', 'failed')),
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_bradox_whatsapp_sessions_network on bradox_revenda.whatsapp_sessions(network_id, status);
create index if not exists idx_bradox_whatsapp_webhook_events_status on bradox_revenda.whatsapp_webhook_events(processing_status, received_at);
create index if not exists idx_bradox_whatsapp_queue_status on bradox_revenda.whatsapp_message_queue(status, next_attempt_at);
create index if not exists idx_bradox_whatsapp_queue_network on bradox_revenda.whatsapp_message_queue(network_id, status, created_at desc);
create index if not exists idx_bradox_whatsapp_messages_network on bradox_revenda.whatsapp_messages(network_id, occurred_at desc);
create index if not exists idx_bradox_whatsapp_messages_provider_id on bradox_revenda.whatsapp_messages(provider_message_id) where provider_message_id is not null;

alter table bradox_revenda.whatsapp_gateway_settings enable row level security;
alter table bradox_revenda.whatsapp_sessions enable row level security;
alter table bradox_revenda.whatsapp_webhook_events enable row level security;
alter table bradox_revenda.whatsapp_message_queue enable row level security;
alter table bradox_revenda.whatsapp_messages enable row level security;

create policy "Admin manage whatsapp gateway settings" on bradox_revenda.whatsapp_gateway_settings
for all to authenticated
using (bradox_revenda.current_user_is_admin())
with check (bradox_revenda.current_user_is_admin());

create policy "Admin scoped all whatsapp sessions" on bradox_revenda.whatsapp_sessions
for all to authenticated
using (bradox_revenda.current_user_is_admin())
with check (bradox_revenda.current_user_is_admin());

create policy "Revenda scoped whatsapp sessions" on bradox_revenda.whatsapp_sessions
for all to authenticated
using (bradox_revenda.current_profile_role() = 'revenda' and network_id = bradox_revenda.current_network_id())
with check (bradox_revenda.current_profile_role() = 'revenda' and network_id = bradox_revenda.current_network_id());

create policy "Admin scoped all whatsapp events" on bradox_revenda.whatsapp_webhook_events
for select to authenticated
using (bradox_revenda.current_user_is_admin());

create policy "Revenda read own whatsapp events" on bradox_revenda.whatsapp_webhook_events
for select to authenticated
using (bradox_revenda.current_profile_role() = 'revenda' and network_id = bradox_revenda.current_network_id());

create policy "Admin scoped all whatsapp queue" on bradox_revenda.whatsapp_message_queue
for all to authenticated
using (bradox_revenda.current_user_is_admin())
with check (bradox_revenda.current_user_is_admin());

create policy "Revenda scoped whatsapp queue" on bradox_revenda.whatsapp_message_queue
for all to authenticated
using (bradox_revenda.current_profile_role() = 'revenda' and network_id = bradox_revenda.current_network_id())
with check (bradox_revenda.current_profile_role() = 'revenda' and network_id = bradox_revenda.current_network_id());

create policy "Admin scoped all whatsapp messages" on bradox_revenda.whatsapp_messages
for select to authenticated
using (bradox_revenda.current_user_is_admin());

create policy "Revenda read own whatsapp messages" on bradox_revenda.whatsapp_messages
for select to authenticated
using (bradox_revenda.current_profile_role() = 'revenda' and network_id = bradox_revenda.current_network_id());

create or replace function bradox_revenda.ensure_whatsapp_session(target_network_id uuid default null)
returns bradox_revenda.whatsapp_sessions
language plpgsql
security definer
set search_path = bradox_revenda, public, auth
as $$
declare
  current_profile bradox_revenda.profiles%rowtype;
  resolved_network_id uuid;
  session_name text;
  saved_session bradox_revenda.whatsapp_sessions%rowtype;
begin
  select * into current_profile
  from bradox_revenda.profiles
  where id = auth.uid()
    and status = 'active'
  limit 1;

  if current_profile.id is null then
    raise exception 'Perfil autenticado nao encontrado';
  end if;

  resolved_network_id := coalesce(target_network_id, current_profile.network_id);
  if resolved_network_id is null then
    raise exception 'Rede obrigatoria para sessao WhatsApp';
  end if;

  if current_profile.role <> 'admin' and current_profile.network_id is distinct from resolved_network_id then
    raise exception 'Sem permissao para gerenciar sessao WhatsApp desta rede';
  end if;

  session_name := 'bradox-revenda_' || replace(resolved_network_id::text, '-', '');

  insert into bradox_revenda.whatsapp_sessions(
    network_id,
    owner_profile_id,
    external_session_name,
    status
  ) values (
    resolved_network_id,
    current_profile.id,
    session_name,
    'not_configured'
  )
  on conflict (external_session_name) do update set
    owner_profile_id = coalesce(whatsapp_sessions.owner_profile_id, excluded.owner_profile_id),
    updated_at = now()
  returning * into saved_session;

  return saved_session;
end;
$$;

create or replace function bradox_revenda.enqueue_whatsapp_text_message(
  target_session_id uuid,
  recipient_phone text,
  body text,
  metadata jsonb default '{}'::jsonb
)
returns bradox_revenda.whatsapp_message_queue
language plpgsql
security definer
set search_path = bradox_revenda, public, auth
as $$
declare
  current_profile bradox_revenda.profiles%rowtype;
  target_session bradox_revenda.whatsapp_sessions%rowtype;
  queued_message bradox_revenda.whatsapp_message_queue%rowtype;
begin
  select * into current_profile
  from bradox_revenda.profiles
  where id = auth.uid()
    and status = 'active'
  limit 1;

  if current_profile.id is null then
    raise exception 'Perfil autenticado nao encontrado';
  end if;

  select * into target_session
  from bradox_revenda.whatsapp_sessions
  where id = target_session_id
    and external_session_name like 'bradox-revenda_%'
  limit 1;

  if target_session.id is null then
    raise exception 'Sessao WhatsApp invalida para este sistema';
  end if;

  if current_profile.role <> 'admin' and current_profile.network_id is distinct from target_session.network_id then
    raise exception 'Sem permissao para enviar por esta sessao';
  end if;

  if nullif(trim(recipient_phone), '') is null or nullif(trim(body), '') is null then
    raise exception 'Destinatario e mensagem sao obrigatorios';
  end if;

  insert into bradox_revenda.whatsapp_message_queue(
    network_id,
    session_id,
    recipient_phone,
    message_type,
    body,
    metadata,
    created_by
  ) values (
    target_session.network_id,
    target_session.id,
    regexp_replace(recipient_phone, '[^0-9]', '', 'g'),
    'text',
    trim(body),
    coalesce(metadata, '{}'::jsonb),
    current_profile.id
  ) returning * into queued_message;

  return queued_message;
end;
$$;

drop trigger if exists tr_bradox_whatsapp_gateway_settings_updated_at on bradox_revenda.whatsapp_gateway_settings;
create trigger tr_bradox_whatsapp_gateway_settings_updated_at before update on bradox_revenda.whatsapp_gateway_settings for each row execute function bradox_revenda.set_updated_at();

drop trigger if exists tr_bradox_whatsapp_sessions_updated_at on bradox_revenda.whatsapp_sessions;
create trigger tr_bradox_whatsapp_sessions_updated_at before update on bradox_revenda.whatsapp_sessions for each row execute function bradox_revenda.set_updated_at();

drop trigger if exists tr_bradox_whatsapp_webhook_events_updated_at on bradox_revenda.whatsapp_webhook_events;
create trigger tr_bradox_whatsapp_webhook_events_updated_at before update on bradox_revenda.whatsapp_webhook_events for each row execute function bradox_revenda.set_updated_at();

drop trigger if exists tr_bradox_whatsapp_queue_updated_at on bradox_revenda.whatsapp_message_queue;
create trigger tr_bradox_whatsapp_queue_updated_at before update on bradox_revenda.whatsapp_message_queue for each row execute function bradox_revenda.set_updated_at();

drop trigger if exists tr_bradox_whatsapp_messages_updated_at on bradox_revenda.whatsapp_messages;
create trigger tr_bradox_whatsapp_messages_updated_at before update on bradox_revenda.whatsapp_messages for each row execute function bradox_revenda.set_updated_at();

insert into bradox_revenda.whatsapp_gateway_settings(
  provider,
  status,
  api_base_url,
  api_key_secret_ref,
  session_namespace,
  shared_gateway,
  metadata
) values (
  'waha_plus',
  'active',
  'https://whats-gateway.brgestor.com',
  'WAHA_PLUS_API_KEY',
  'bradox-revenda_',
  true,
  jsonb_build_object('isolation_rule', 'Only manage sessions prefixed with bradox-revenda_')
)
on conflict (provider) do update set
  status = excluded.status,
  api_base_url = excluded.api_base_url,
  api_key_secret_ref = excluded.api_key_secret_ref,
  session_namespace = excluded.session_namespace,
  shared_gateway = excluded.shared_gateway,
  metadata = excluded.metadata,
  updated_at = now();

grant select on bradox_revenda.whatsapp_gateway_settings to authenticated;
grant select, insert, update on bradox_revenda.whatsapp_sessions to authenticated;
grant select, insert, update on bradox_revenda.whatsapp_message_queue to authenticated;
grant select on bradox_revenda.whatsapp_webhook_events to authenticated;
grant select on bradox_revenda.whatsapp_messages to authenticated;

grant select, insert, update on bradox_revenda.whatsapp_gateway_settings to service_role;
grant select, insert, update on bradox_revenda.whatsapp_sessions to service_role;
grant select, insert, update on bradox_revenda.whatsapp_webhook_events to service_role;
grant select, insert, update on bradox_revenda.whatsapp_message_queue to service_role;
grant select, insert, update on bradox_revenda.whatsapp_messages to service_role;

grant execute on function bradox_revenda.ensure_whatsapp_session(uuid) to authenticated, service_role;
grant execute on function bradox_revenda.enqueue_whatsapp_text_message(uuid, text, text, jsonb) to authenticated, service_role;

notify pgrst, 'reload schema';