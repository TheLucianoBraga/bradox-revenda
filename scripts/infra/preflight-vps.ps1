param(
  [string]$VpsHost = "root@72.60.252.115",
  [int]$MinFreeGb = 5
)

$ErrorActionPreference = "Stop"

Write-Host "Preflight VPS: $VpsHost"

$diskLine = ssh $VpsHost "df -Pk / | tail -1"
$diskParts = $diskLine -split "\s+"
if ($diskParts.Count -lt 4) {
  throw "Nao foi possivel interpretar df: $diskLine"
}

$freeKb = [int64]$diskParts[3]
$freeGb = [math]::Round($freeKb / 1024 / 1024, 2)
Write-Host "Espaco livre em /: $freeGb GB"

$containers = (ssh $VpsHost "docker ps -a --format '{{.Names}}' | grep -E '^bradox-revenda-' || true") -join "`n"
$volumes = (ssh $VpsHost "docker volume ls --format '{{.Name}}' | grep -E 'bradox-revenda' || true") -join "`n"
$networks = (ssh $VpsHost "docker network ls --format '{{.Name}}' | grep -E '^(bradox-revenda-private|infra-network)$' || true") -join "`n"

if ($containers.Trim()) {
  Write-Host "Containers bradox-revenda existentes:"
  Write-Host $containers
}

if ($volumes.Trim()) {
  Write-Host "Volumes bradox-revenda existentes:"
  Write-Host $volumes
}

Write-Host "Redes relevantes:"
Write-Host $networks

if ($freeGb -lt $MinFreeGb) {
  throw "Espaco insuficiente para subir Postgres isolado. Livre: $freeGb GB; minimo: $MinFreeGb GB."
}

if ($networks -notmatch "infra-network") {
  throw "Rede Docker externa infra-network nao encontrada."
}

Write-Host "Preflight aprovado."