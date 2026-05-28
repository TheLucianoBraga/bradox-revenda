# Runbook - inicio da migracao isolada

## Pre-flight

1. Criar banco/stack novo do `bradox-revenda`.
2. Configurar `PGRST_DB_SCHEMAS=bradox_revenda` no PostgREST do novo ambiente.
3. Configurar `.env` do frontend com URL e anon key do novo projeto.
4. Aplicar `supabase/migrations/20260526000100_bradox_revenda_foundation.sql` no banco novo.

## Export do legado

```powershell
./scripts/migration/export-network-hub.ps1
```

Esse script gera um pacote local em `migration-export/` com dumps de dados do schema `network_hub` e das tabelas legadas ainda usadas em `public`.

## Import inicial

O import final deve ser feito por transformacao controlada, nao por restore direto, porque o destino foi remodelado para `bradox_revenda`.

Depois de restaurar o pacote exportado em um banco/staging acessivel ao destino, rode:

```sql
\i scripts/migration/import-core-from-legacy.sql
```

Ordem recomendada:

1. networks
2. profiles
3. user_hierarchy
4. servers
5. plans
6. orders
7. message_templates

## Validacao

```sql
\i scripts/migration/validate-bradox-revenda.sql
```

## Regra de rollback

Enquanto o cutover nao acontecer, rollback e simplesmente voltar o frontend/rotas para o legado. Nunca apagar ou sobrescrever dados do legado durante backfill.