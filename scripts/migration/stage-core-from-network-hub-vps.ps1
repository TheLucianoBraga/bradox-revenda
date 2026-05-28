param(
  [string]$VpsHost = "root@72.60.252.115",
  [string]$SourceDbContainer = "supabase-db",
  [string]$SourceDb = "postgres",
  [string]$TargetDbContainer = "bradox-revenda-db",
  [string]$TargetDb = "bradox_revenda",
  [switch]$Execute
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "../..")
$importSql = Join-Path $repoRoot "scripts/migration/import-core-from-legacy.sql"
$validateSql = Join-Path $repoRoot "scripts/migration/validate-bradox-revenda.sql"

if (-not (Test-Path $importSql)) { throw "Import SQL nao encontrado: $importSql" }
if (-not (Test-Path $validateSql)) { throw "Validate SQL nao encontrado: $validateSql" }

function Invoke-RemotePsqlText {
  param(
    [Parameter(Mandatory = $true)][string]$Container,
    [Parameter(Mandatory = $true)][string]$Database,
    [Parameter(Mandatory = $true)][string]$Sql
  )

  $output = $Sql | ssh $VpsHost "docker exec -i $Container psql -U postgres -d $Database -At -v ON_ERROR_STOP=1"
  if ($LASTEXITCODE -ne 0) { throw "psql remoto falhou em $Container/$Database" }
  return $output
}

function Invoke-CheckedSsh {
  param([Parameter(Mandatory = $true)][string]$Command)

  ssh $VpsHost $Command
  if ($LASTEXITCODE -ne 0) { throw "Comando remoto falhou: $Command" }
}

Write-Host "Origem: $SourceDbContainer/$SourceDb schema network_hub"
Write-Host "Destino: $TargetDbContainer/$TargetDb schema bradox_revenda"

$sourceCheck = Invoke-RemotePsqlText -Container $SourceDbContainer -Database $SourceDb -Sql "select to_regnamespace('network_hub') is not null;"
if (($sourceCheck | Select-Object -First 1) -ne "t") {
  throw "Schema network_hub nao existe na origem. Abortando."
}

Write-Host "Contagens origem:"
Invoke-RemotePsqlText -Container $SourceDbContainer -Database $SourceDb -Sql "select 'network_hub.networks|'||count(*) from network_hub.networks union all select 'network_hub.profiles|'||count(*) from network_hub.profiles union all select 'network_hub.user_roles|'||count(*) from network_hub.user_roles union all select 'network_hub.user_hierarchy|'||count(*) from network_hub.user_hierarchy union all select 'network_hub.servers|'||count(*) from network_hub.servers union all select 'network_hub.plans|'||count(*) from network_hub.plans union all select 'network_hub.orders|'||count(*) from network_hub.orders union all select 'network_hub.message_templates|'||count(*) from network_hub.message_templates union all select 'network_hub.network_tool_categories|'||count(*) from network_hub.network_tool_categories union all select 'network_hub.network_tools|'||count(*) from network_hub.network_tools order by 1;"

if (-not $Execute) {
  Write-Host "DRY-RUN: nada foi alterado. Use -Execute para recriar staging network_hub no destino, importar core e validar."
  exit 0
}

Write-Host "Recriando staging network_hub no destino..."
@'
drop schema if exists network_hub cascade;
create schema network_hub;

create type network_hub.app_role as enum ('admin', 'revenda', 'cliente', 'super_admin', 'revenda_adm');
create type network_hub.order_status as enum ('pendente', 'pago', 'concluido', 'cancelado');
create type network_hub.order_type as enum ('plano', 'creditos');
create type network_hub.plan_type as enum ('pós', 'revenda', 'cliente');

create table network_hub.networks (
  id uuid,
  name text,
  slug text,
  is_admin_network boolean,
  created_at timestamptz,
  updated_at timestamptz
);

create table network_hub.profiles (
  id uuid,
  network_id uuid,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz,
  updated_at timestamptz,
  phone text,
  last_login_at timestamptz
);

create table network_hub.user_roles (
  id uuid,
  user_id uuid,
  role network_hub.app_role
);

create table network_hub.user_hierarchy (
  id uuid,
  user_id uuid,
  parent_id uuid,
  created_at timestamptz
);

create table network_hub.servers (
  id uuid,
  network_id uuid,
  name text,
  credit_price numeric,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz,
  min_credits integer,
  requires_image_proof boolean,
  created_by uuid,
  settlement_day integer
);

create table network_hub.plans (
  id uuid,
  network_id uuid,
  name text,
  description text,
  price numeric,
  duration_days integer,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz,
  plan_type network_hub.plan_type,
  created_by uuid,
  features text[],
  proof_document_url text,
  active_quantity_document_url text
);

create table network_hub.orders (
  id uuid,
  network_id uuid,
  user_id uuid,
  order_type network_hub.order_type,
  status network_hub.order_status,
  total numeric,
  plan_id uuid,
  server_id uuid,
  credit_quantity integer,
  notes text,
  created_at timestamptz,
  updated_at timestamptz,
  proof_image_url text,
  payment_method text,
  panel_image_url text
);

create table network_hub.message_templates (
  id uuid,
  network_id uuid,
  name text,
  template_type text,
  content text,
  is_default boolean,
  is_active boolean,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz,
  image_urls jsonb
);

create table network_hub.network_tool_categories (
  id uuid,
  network_id uuid,
  owner_id uuid,
  name text,
  display_order integer,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz,
  icon text
);

create table network_hub.network_tools (
  id uuid,
  network_id uuid,
  owner_id uuid,
  name text,
  url text,
  icon text,
  display_order integer,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz,
  category_id uuid,
  image_url text
);
'@ | ssh $VpsHost "docker exec -i $TargetDbContainer psql -U postgres -d $TargetDb -v ON_ERROR_STOP=1"
if ($LASTEXITCODE -ne 0) { throw "Falha ao recriar staging network_hub no destino" }

Write-Host "Transferindo dados core network_hub origem -> staging destino..."
Invoke-CheckedSsh "set -euo pipefail; docker exec $SourceDbContainer pg_dump -U postgres -d $SourceDb --data-only --column-inserts --no-owner --no-privileges -t network_hub.networks -t network_hub.profiles -t network_hub.user_roles -t network_hub.user_hierarchy -t network_hub.servers -t network_hub.plans -t network_hub.orders -t network_hub.message_templates -t network_hub.network_tool_categories -t network_hub.network_tools | docker exec -i $TargetDbContainer psql -U postgres -d $TargetDb -v ON_ERROR_STOP=1"

Write-Host "Aplicando import core para bradox_revenda..."
Get-Content -Raw $importSql | ssh $VpsHost "docker exec -i $TargetDbContainer psql -U postgres -d $TargetDb -v ON_ERROR_STOP=1"
if ($LASTEXITCODE -ne 0) { throw "Import core falhou" }

Write-Host "Validando destino..."
Get-Content -Raw $validateSql | ssh $VpsHost "docker exec -i $TargetDbContainer psql -U postgres -d $TargetDb -v ON_ERROR_STOP=1"
if ($LASTEXITCODE -ne 0) { throw "Validacao falhou" }

Write-Host "Import core concluido. Staging network_hub mantido no destino para auditoria temporaria."