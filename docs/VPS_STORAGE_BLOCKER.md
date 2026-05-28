# Bloqueio de armazenamento da VPS

Data da leitura: 26/05/2026.

## Estado atual

- `/` esta em 100% de uso.
- Espaco livre aproximado: `0.29 GB`.
- O preflight de deploy do Bradox Revenda exige no minimo `5 GB` livres.
- A stack isolada nao deve ser iniciada com esse espaco, porque inclui Postgres dedicado.

## Maiores consumidores encontrados

- `/opt/infra/core/volumes/supabase`: `26 GB`.
- Database `networkhub`: `16 GB`.
- Tabela `public.whatsapp_inbound_messages`: `16 GB`, com cerca de `42.414` linhas entre `2026-04-09` e `2026-05-23`.
- Storage `whatsapp_media`: `9.1 GB` em `/opt/infra/core/volumes/supabase/storage/stub/stub/whatsapp_media`.
- `/var/lib/containerd`: `17 GB`.
- Docker build cache recuperavel reportado: cerca de `863 MB`.

## Scripts de diagnostico

```powershell
./scripts/infra/diagnose-vps-storage.ps1
```

Para diagnostico SQL no database `networkhub`:

```bash
docker exec -i supabase-db psql -U postgres -d networkhub < scripts/infra/diagnose-networkhub-retention.sql
```

## Regra antes de limpar

Nao apagar dados de `auth`, `network_hub`, `public.whatsapp_inbound_messages` ou arquivos de storage sem backup e confirmacao explicita. A tabela pesada parece log/historico de inbound WhatsApp, mas ainda precisa de decisao de retencao antes de qualquer DELETE.

## Caminho recomendado

1. Limpar caches seguros primeiro. Isso nao deve tocar dados reais:

```powershell
./scripts/infra/free-vps-safe-cache.ps1
./scripts/infra/free-vps-safe-cache.ps1 -Execute
```

2. Fazer backup do database `networkhub` ou pelo menos da tabela `public.whatsapp_inbound_messages`.
3. Definir retencao para inbound WhatsApp, por exemplo manter 7, 15 ou 30 dias.
4. Se confirmar limpeza, apagar em lotes pequenos e rodar `VACUUM`/manutencao apropriada depois.
5. Avaliar arquivamento/limpeza de `whatsapp_media`, preferencialmente por idade e com backup.
6. Reexecutar `./scripts/infra/preflight-vps.ps1` e so subir o `bradox-revenda` quando houver pelo menos 5 GB livres.

## O que pode ser limpo agora com menor risco

- Docker build cache: liberacao estimada de ate `863 MB`.
- Cache APT: liberacao pequena, cerca de `123 MB` observados em `/var/cache/apt`.
- Journald: manter limite de `100 MB`, liberacao pequena/moderada.

Esses itens ajudam, mas provavelmente nao bastam. Para liberar espaco suficiente, o alvo real e a retencao/arquivamento de `public.whatsapp_inbound_messages` e `whatsapp_media`.

## Retencao de inbound WhatsApp

Diagnostico em 26/05/2026:

- Todos os `42.414` registros de `public.whatsapp_inbound_messages` tinham mais de 48h.
- `messages.upsert` representava cerca de `15 GB` do payload bruto.
- Arquivos fisicos em `whatsapp_media` com mais de 48h: cerca de `4.301`, somando `9.02 GB`.

Script dry-run:

```powershell
./scripts/infra/cleanup-whatsapp-inbound-retention.ps1
```

Limpar apenas arquivos fisicos antigos de media:

```powershell
./scripts/infra/cleanup-whatsapp-inbound-retention.ps1 -ExecuteMediaFiles
```

Limpar a tabela inteira somente quando os registros forem considerados descartaveis:

```powershell
./scripts/infra/cleanup-whatsapp-inbound-retention.ps1 -ExecuteDatabaseTruncate
```

Observacao: `DELETE` por data pode nao devolver espaco ao sistema operacional imediatamente. Como todos os registros atuais estavam fora da janela de 48h, `TRUNCATE` e o caminho mais eficiente para liberar o arquivo da tabela, mas apaga todo o historico inbound.

## O que nao apagar manualmente

- Nao remover arquivos de `/var/lib/containerd` na mao.
- Nao remover `/opt/infra/core/volumes/supabase/db`.
- Nao apagar `/opt/infra/core/volumes/supabase/storage` inteiro.
- Nao rodar `docker system prune -a --volumes` nesta VPS.
- Nao truncar tabelas de producao sem backup e confirmacao.