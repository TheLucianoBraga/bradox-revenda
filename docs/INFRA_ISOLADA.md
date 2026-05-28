# Infra isolada do Bradox Revenda

Esta pasta prepara uma stack nova para o `bradox-revenda`, sem reutilizar o banco, JWT, service role, volumes ou schema do `network-hub` legado.

## Arquivos

- `infra/docker-compose.isolated.yml`: Postgres dedicado, Auth, PostgREST, Realtime e Kong.
- `infra/docker-compose.app.yml`: frontend `bradox-revenda-app` isolado, exposto pelo Traefik no `APP_DOMAIN`.
- `infra/bradox-revenda.env.example`: variaveis de ambiente sem segredos reais.
- `infra/volumes/api/kong.yml`: rotas `/auth/v1`, `/rest/v1` e `/realtime/v1`.
- `infra/volumes/db/init/00-bradox-roles.sh`: roles minimas para PostgREST/Auth/Realtime.

## Regras

- `PGRST_DB_SCHEMAS` deve ser apenas `bradox_revenda`.
- O container de banco deve ser `bradox-revenda-db`, nunca `supabase-db`.
- A migration do schema deve rodar no DB `bradox_revenda` da stack nova.
- O export do legado e o import transformado devem ser feitos por lote, preservando `legacy_network_hub_id`.

## Sequencia segura

1. Copiar `infra/bradox-revenda.env.example` para `.env` na VPS.
2. Gerar segredos novos para `POSTGRES_PASSWORD`, `JWT_SECRET`, `ANON_KEY`, `SERVICE_ROLE_KEY` e `SECRET_KEY_BASE`.

```powershell
npm run infra:keys
```

3. Subir a stack isolada com `docker compose --env-file .env -f infra/docker-compose.isolated.yml up -d`.
4. Validar a VPS antes de copiar/subir qualquer coisa:

```powershell
./scripts/infra/preflight-vps.ps1
```

5. Enviar os arquivos de infra em modo dry-run primeiro:

```powershell
./scripts/infra/deploy-infra-vps.ps1
```

6. Quando o preflight estiver aprovado, enviar os arquivos:

```powershell
./scripts/infra/deploy-infra-vps.ps1 -Execute
```

7. Aplicar a foundation com dry-run primeiro:

```powershell
./scripts/migration/apply-foundation-vps.ps1
```

8. Depois da stack validada, aplicar de verdade:

```powershell
./scripts/migration/apply-foundation-vps.ps1 -Execute
```

9. Exportar legado, restaurar em staging e rodar `scripts/migration/import-core-from-legacy.sql`.

## Subir o frontend depois da API

Depois que `api.bradox-revenda...` estiver respondendo, valide e suba o app:

```bash
docker compose --env-file .env -f infra/docker-compose.app.yml config
docker compose --env-file .env -f infra/docker-compose.app.yml up -d --build
```

O build do frontend usa `VITE_BRADOX_SUPABASE_URL`, `VITE_BRADOX_SUPABASE_ANON_KEY` e `VITE_BRADOX_SUPABASE_SCHEMA` do `.env`.

## Bloqueio atual conhecido

Em 26/05/2026, a VPS estava com `/` em 100% de uso e cerca de 300 MB livres. Nessa condicao, nao suba Postgres novo nem rode import. Libere espaco ou aumente o disco antes do primeiro deploy da stack isolada.

Detalhes e diagnosticos estao em `docs/VPS_STORAGE_BLOCKER.md`.