param(
  [string]$VpsHost = "root@72.60.252.115",
  [string]$RemoteDir = "/opt/infra/bradox-revenda",
  [switch]$Execute
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "../..")
$migration = Join-Path $root "supabase/migrations/20260526000100_bradox_revenda_foundation.sql"

if (-not (Test-Path $migration)) {
  throw "Migration foundation nao encontrada: $migration"
}

Write-Host "Destino VPS: ${VpsHost}:$RemoteDir"
Write-Host "Migration: $migration"

if (-not $Execute) {
  Write-Host "Dry-run. Use -Execute apenas depois que a stack isolada estiver criada e validada."
  Write-Host "Comando planejado: docker exec -i bradox-revenda-db psql -U postgres bradox_revenda < foundation.sql"
  exit 0
}

ssh $VpsHost "mkdir -p $RemoteDir/migrations"
scp $migration "${VpsHost}:$RemoteDir/migrations/20260526000100_bradox_revenda_foundation.sql"
ssh $VpsHost "docker exec -i bradox-revenda-db psql -v ON_ERROR_STOP=1 -U postgres bradox_revenda < $RemoteDir/migrations/20260526000100_bradox_revenda_foundation.sql"

Write-Host "Foundation aplicada no banco isolado bradox-revenda-db."