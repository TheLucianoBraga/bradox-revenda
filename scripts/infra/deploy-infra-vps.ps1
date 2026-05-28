param(
  [string]$VpsHost = "root@72.60.252.115",
  [string]$RemoteDir = "/opt/infra/bradox-revenda",
  [switch]$Execute
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "../..")

& (Join-Path $PSScriptRoot "preflight-vps.ps1") -VpsHost $VpsHost

Write-Host "Destino: ${VpsHost}:$RemoteDir"

if (-not $Execute) {
  Write-Host "Dry-run. Use -Execute para copiar infra/supabase/scripts para a VPS."
  Write-Host "Depois de copiar, crie $RemoteDir/.env a partir de infra/bradox-revenda.env.example com segredos novos."
  exit 0
}

ssh $VpsHost "mkdir -p $RemoteDir"
scp -r (Join-Path $root "infra") "${VpsHost}:$RemoteDir/"
scp -r (Join-Path $root "supabase") "${VpsHost}:$RemoteDir/"
ssh $VpsHost "mkdir -p $RemoteDir/scripts"
scp -r (Join-Path $root "scripts/migration") "${VpsHost}:$RemoteDir/scripts/"
ssh $VpsHost "chmod 755 $RemoteDir/infra/volumes $RemoteDir/infra/volumes/db $RemoteDir/infra/volumes/db/init 2>/dev/null || true"
$renderKong = 'cd ' + $RemoteDir + ' && if [ -f .env ]; then ANON_KEY=$(grep -m1 ''^ANON_KEY='' .env | cut -d= -f2- | tr -d ''\r''); SERVICE_ROLE_KEY=$(grep -m1 ''^SERVICE_ROLE_KEY='' .env | cut -d= -f2- | tr -d ''\r''); awk -v anon="$ANON_KEY" -v service="$SERVICE_ROLE_KEY" ''{gsub(/\$\{SUPABASE_ANON_KEY\}/, anon); gsub(/\$\{SUPABASE_SERVICE_KEY\}/, service); print}'' infra/volumes/api/kong.yml > infra/volumes/api/kong.yml.rendered && mv infra/volumes/api/kong.yml.rendered infra/volumes/api/kong.yml; fi'
ssh $VpsHost $renderKong

Write-Host "Arquivos enviados. Nao subi containers automaticamente."
Write-Host "Proximo passo na VPS: cd $RemoteDir && docker compose --env-file .env -f infra/docker-compose.isolated.yml config"