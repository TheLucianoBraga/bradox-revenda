param(
  [string]$VpsHost = "root@72.60.252.115",
  [int]$RetentionHours = 48,
  [switch]$ExecuteMediaFiles,
  [switch]$ExecuteDatabaseTruncate
)

$ErrorActionPreference = "Stop"
$mediaPath = "/opt/infra/core/volumes/supabase/storage/stub/stub/whatsapp_media"
$minutes = $RetentionHours * 60

Write-Host "Retencao WhatsApp inbound: $RetentionHours horas"
Write-Host "VPS: $VpsHost"

Write-Host "== Banco: estimativa de registros antigos =="
$dbEstimateSql = "select concat(count(*) filter (where created_at < now() - make_interval(hours => $RetentionHours)), chr(124), count(*), chr(124), pg_size_pretty(pg_total_relation_size('public.whatsapp_inbound_messages'))) from public.whatsapp_inbound_messages;"
ssh $VpsHost "docker exec supabase-db psql -U postgres -d networkhub -Atc `"$dbEstimateSql`""

Write-Host "== Midias: estimativa de arquivos antigos =="
$mediaEstimateCommand = @'
find __MEDIA_PATH__ -type f -mmin +__MINUTES__ -printf '%s\n' 2>/dev/null | awk '{s+=$1; c++} END {printf "%d|%.2f GB\n", c, s/1024/1024/1024}'
'@
$mediaEstimateCommand = $mediaEstimateCommand.Replace("__MEDIA_PATH__", $mediaPath).Replace("__MINUTES__", [string]$minutes)
ssh $VpsHost $mediaEstimateCommand

if (-not $ExecuteMediaFiles -and -not $ExecuteDatabaseTruncate) {
  Write-Host "Dry-run. Nada foi apagado."
  Write-Host "Use -ExecuteMediaFiles para apagar arquivos fisicos de midia com mais de $RetentionHours horas."
  Write-Host "Use -ExecuteDatabaseTruncate apenas se todos os registros forem descartaveis; TRUNCATE libera espaco melhor que DELETE."
  exit 0
}

if ($ExecuteMediaFiles) {
  Write-Host "Apagando arquivos de midia com mais de $RetentionHours horas..."
  ssh $VpsHost "find $mediaPath -type f -mmin +$minutes -delete"
}

if ($ExecuteDatabaseTruncate) {
  Write-Host "TRUNCATE em public.whatsapp_inbound_messages..."
  ssh $VpsHost "docker exec supabase-db psql -U postgres -d networkhub -c 'truncate table public.whatsapp_inbound_messages;'"
}

Write-Host "== Espaco apos operacao =="
ssh $VpsHost "df -h /"