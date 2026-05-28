param(
  [string]$VpsHost = "root@72.60.252.115"
)

$ErrorActionPreference = "Stop"

Write-Host "== Disco =="
ssh $VpsHost "df -h /"

Write-Host "== Top /opt =="
ssh $VpsHost "du -xh --max-depth=2 /opt 2>/dev/null | sort -h | tail -25"

Write-Host "== Top /var =="
ssh $VpsHost "du -xh --max-depth=2 /var 2>/dev/null | sort -h | tail -25"

Write-Host "== Docker =="
ssh $VpsHost "docker system df"

Write-Host "== Databases Postgres =="
ssh $VpsHost 'docker exec supabase-db psql -U postgres -d postgres -Atc "select concat(datname, chr(124), pg_size_pretty(pg_database_size(datname))) from pg_database order by pg_database_size(datname) desc;"'

Write-Host "== Maiores tabelas networkhub =="
ssh $VpsHost 'docker exec supabase-db psql -U postgres -d networkhub -Atc "select concat(schemaname, chr(46), relname, chr(124), pg_size_pretty(pg_total_relation_size(format(chr(37)||chr(73)||chr(46)||chr(37)||chr(73), schemaname, relname)))) from pg_stat_user_tables order by pg_total_relation_size(format(chr(37)||chr(73)||chr(46)||chr(37)||chr(73), schemaname, relname)) desc limit 30;"'

Write-Host "== Storage Supabase =="
ssh $VpsHost "du -xh --max-depth=3 /opt/infra/core/volumes/supabase/storage/stub/stub 2>/dev/null | sort -h | tail -30"