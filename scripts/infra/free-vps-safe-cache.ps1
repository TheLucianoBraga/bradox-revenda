param(
  [string]$VpsHost = "root@72.60.252.115",
  [switch]$Execute
)

$ErrorActionPreference = "Stop"

Write-Host "Limpeza segura de cache na VPS: $VpsHost"
Write-Host "Nao remove dados de banco, storage, volumes, imagens ativas ou containers."

$commands = @(
  "docker builder prune -f",
  "apt-get clean",
  "journalctl --vacuum-size=100M"
)

if (-not $Execute) {
  Write-Host "Dry-run. Comandos planejados:"
  foreach ($command in $commands) {
    Write-Host "- $command"
  }
  Write-Host "Use -Execute para executar apenas essa limpeza de cache."
  exit 0
}

foreach ($command in $commands) {
  Write-Host "Executando: $command"
  ssh $VpsHost $command
}

Write-Host "Espaco apos limpeza:"
ssh $VpsHost "df -h /; docker system df"