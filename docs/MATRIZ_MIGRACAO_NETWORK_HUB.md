# Matriz inicial de migracao: network-hub -> bradox-revenda

## Regra de isolamento

- Fonte: projeto legado `network-hub`.
- Destino: banco novo dedicado do `bradox-revenda`.
- Schema destino: `bradox_revenda`.
- Nao usar tabelas novas em `public`.
- Preservar IDs de usuario do Auth quando possivel.

## Onda 1 - Core operacional

| Legado | Destino | Observacao |
| --- | --- | --- |
| `network_hub.networks` / `public.networks` | `bradox_revenda.networks` | Manter `legacy_network_hub_id` para reconciliacao. |
| `network_hub.profiles` / `public.profiles` | `bradox_revenda.profiles` | Preservar `id` igual ao `auth.users.id`. |
| `network_hub.user_hierarchy` / `public.user_hierarchy` | `bradox_revenda.user_hierarchy` | Migrar depois de profiles. |
| `network_hub.servers` / `public.servers` | `bradox_revenda.servers` | Sanitizar credenciais antes de homologacao. |
| `network_hub.plans` / `public.plans` | `bradox_revenda.plans` | Normalizar `duration_days`, `credits` e `price`. |
| `network_hub.orders` / `public.orders` | `bradox_revenda.orders` | Migrar metadata para preservar campos ainda nao modelados. |
| `network_hub.message_templates` / `public.message_templates` | `bradox_revenda.message_templates` | Substitui `localStorage` da tela de templates. |

## Onda 2 - WhatsApp e automacoes

| Legado | Destino | Observacao |
| --- | --- | --- |
| `network_hub.user_whatsapp_instances` / `public.user_whatsapp_instances` | a criar | Depende do desenho final do provedor WhatsApp. |
| `network_hub.whatsapp_billing_automation_settings` | a criar | Migrar depois do core. |
| `network_hub.whatsapp_billing_dispatch_log` | a criar | Historico pode ir para storage frio se crescer muito. |
| `public.group_schedule_*` | a criar | Hoje ainda existe em `public`; mover para schema isolado. |

## Onda 3 - Notificacoes, loja e analytics

| Legado | Destino | Observacao |
| --- | --- | --- |
| `network_hub.notification_*` / `public.notification_*` | a criar | Evitar duplicar schemas mistos. |
| `network_hub.store_*` | a criar | Pode virar modulo separado. |
| `public.campaign_*` | a criar | Migrar junto com worker/runtime. |

## Validacao minima por lote

1. Contagem origem e destino.
2. Amostra por `legacy_network_hub_id`.
3. Login de usuario migrado.
4. Consulta por tenant/rede.
5. Escrita nova no destino sem tocar legado.

## Scripts disponiveis

- `scripts/migration/export-network-hub.ps1`: gera pacote de dados do legado na VPS.
- `scripts/migration/import-core-from-legacy.sql`: transforma core legado para `bradox_revenda`.
- `scripts/migration/validate-bradox-revenda.sql`: contagens e checks basicos apos import.