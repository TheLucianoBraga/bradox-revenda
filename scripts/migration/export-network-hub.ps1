param(
  [string]$VpsHost = "root@72.60.252.115",
  [string]$SourceDb = "postgres",
  [string]$OutputDir = "./migration-export"
)

$ErrorActionPreference = "Stop"
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$remoteDir = "/tmp/bradox_networkhub_export_$stamp"
$localFile = Join-Path $OutputDir "network_hub_export_$stamp.tar.gz"

ssh $VpsHost "set -e; mkdir -p $remoteDir; docker exec supabase-db pg_dump -U postgres -d $SourceDb -n network_hub --data-only --column-inserts > $remoteDir/network_hub_data.sql; docker exec supabase-db pg_dump -U postgres -d $SourceDb -n public --data-only --column-inserts -t public.networks -t public.profiles -t public.user_roles -t public.user_hierarchy -t public.servers -t public.plans -t public.orders -t public.order_items -t public.message_templates -t public.user_whatsapp_instances -t public.payment_provider_settings > $remoteDir/public_legacy_data.sql; tar -czf $remoteDir.tar.gz -C /tmp $(Split-Path $remoteDir -Leaf)"
scp "${VpsHost}:$remoteDir.tar.gz" $localFile
ssh $VpsHost "rm -rf $remoteDir $remoteDir.tar.gz"

Write-Host "Export criado em $localFile"