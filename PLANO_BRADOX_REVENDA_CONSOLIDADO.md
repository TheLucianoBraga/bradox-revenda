# Plano Consolidado - Bradox Revenda

Data: 2026-05-27

## Objetivo

Construir o `bradox-revenda` como sistema definitivo e substituir o legado por ondas, sem dependencia de runtime no `network-hub`. Toda leitura/escrita operacional deve ocorrer no stack novo. O legado existe apenas como fonte historica temporaria para migracao e sera desligado ao final da reconciliacao e homologacao.

## Estado atual

### Infraestrutura

- Stack isolada ativa no VPS com Postgres, Auth, PostgREST, Realtime, Storage e Kong dedicados.
- App publicado em `https://bradox-revenda.72.60.252.115.nip.io`.
- API publicada em `https://api.bradox-revenda.72.60.252.115.nip.io`.
- Schema principal: `bradox_revenda`.
- Deploy atual: build local com variaveis Vite reais, copia de `dist` para o container e restart do `bradox-revenda-app`.

### Dados migrados ou recriados

| Area | Status | Observacao |
| --- | --- | --- |
| Redes | Concluido base | 4 redes migradas; rede Braga nova mapeia o legado Braga. |
| Auth e admin | Concluido base | `thebragafuture@gmail.com` ativo como admin. |
| Perfis/clientes | Concluido base | Clientes migrados/consolidados; inativos nao aparecem nas telas principais. |
| Hierarquia | Concluido base | Links admin -> clientes preservados/complementados. |
| Servidores | Concluido base | 22 servidores com PRÉ/PÓS e valores reais do legado. |
| Planos | Concluido base | 12 planos e CRUD real. |
| Ferramentas | Concluido | Categorias, links, upload, editar e excluir logico. |
| Templates | Parcial | Dados base existem; falta midia/preview/validacao final. |
| Conteudos | Concluido base | 5 categorias e 14 conteudos migrados; `/posts` com tema escuro Bradox, filtros, busca, status, cards, modal, data de publicacao e ordenacao manual de destaques. |
| Pagamentos/faturas | Parcial | Fatura publica, cobranca manual por cliente/plano, compra de creditos e upload real de comprovante manual existem; falta gateway/webhook. |
| Configuracoes | Parcial | Mercado Pago, UpdePix e Manual salvam estrutura; falta fluxo ponta a ponta. |
| Identidade visual | Concluido base | Logo oficial Bradox Play aplicada em login, sidebar, carregamento, preview de templates, favicon, PWA e metatags sociais. |
| WhatsApp | Pendente | Ainda sem runtime isolado completo no novo schema. |
| IA/automacoes | Pendente | Deve vir depois do WhatsApp real. |
| Portal cliente/revenda | Pendente | Ainda nao implementado como produto separado. |

## Consolidacao dos planos antigos

O plano antigo de migracao isolada virou a base de governanca: ambiente separado, migracao em ondas, validacao e corte seguro do legado.

O plano de execucao por fases virou o roteiro operacional: Auth, dados reais, CRUD, cobranca, WhatsApp, IA, portais, observabilidade, seguranca e corte.

Este arquivo substitui os dois documentos anteriores e passa a ser o plano unico para continuidade.

## Decisoes fixas

1. Nao misturar schema operacional do legado com `bradox_revenda`.
2. Nao reutilizar Auth/JWT/chaves do legado.
3. Proibir referencias de runtime ao legado (`network_hub`, endpoints legados, workers legados) no app novo.
4. Preservar IDs legados em campos `legacy_*` apenas para auditoria e rastreabilidade de migracao.
4. Usar `network_id` da rede ativa em todas as telas autenticadas.
5. Excluir em telas operacionais como soft delete (`inactive` ou `archived`) ate haver politica segura de hard delete.
6. Antes de inferir dados, auditar o legado real.
7. Substituir referencias visuais de IPTV por Tv Online.

## Regra de corte progressivo

- Cada modulo migrado (auth, planos, servidores, cobranca, conteudo, whatsapp, portal) passa a operar 100% no stack novo.
- A partir da migracao de um modulo, qualquer dependencia operacional no legado e considerada regressao.
- O repositório possui guardrail automatico (`guard:no-legacy-runtime`) para bloquear referencias de runtime ao legado no build.
- O legado permanece somente para reconciliacao historica e consulta de auditoria durante a transicao.

## Fases executadas

### Foundation isolada

- Stack isolada criada e publicada.
- Dominio app/API validado.
- Schema `bradox_revenda` criado.
- Storage inicial habilitado para avatar, ferramentas e conteudos.

### Auth e sessao

- Login real com Supabase Auth.
- Admin `thebragafuture@gmail.com` ativo.
- Rotas protegidas com gate client-side para manter sessao em reload forte.
- Perfil atual com nome, telefone, avatar e senha.
- Hardening de sessao/login aplicado para impedir troca cruzada de conta: logout local ao abrir `/login`, limpeza de sessao antes de novo login e validacao estrita de e-mail entre Auth e `profiles`.
- Painel `_app` bloqueado para contas nao-admin, evitando exposicao de operacao administrativa para role `cliente`/`revenda`.

### Dados core

- Redes, perfis, hierarquia, servidores, planos e templates migrados.
- Views/read models base criados.
- Contexto de sessao e seletor de rede implementados.

### Operacao

- Usuarios cliente/revenda com CRUD inicial.
- Planos com CRUD real.
- Servidores com CRUD real, tipo PRÉ/PÓS, valor por credito, minimo e filtros ativos.
- Clientes com planos/servidores e valor personalizado/desconto.
- Ferramentas com CRUD real e upload.

### Cobrancas

- Fatura publica criada.
- Cobranca manual por cliente/plano via RPC.
- Compra de creditos por servidor gerando fatura.
- Fatura mostra preco tabelado, desconto e valor final quando aplicavel.
- Comprovante manual da fatura agora sobe para bucket privado `manual-payment-receipts` e salva apenas a referencia do arquivo no recibo.

### Conteudo legado

- Criado schema `content_categories` e `content` no `bradox_revenda`.
- Criado bucket `content-images`.
- Migradas 5 categorias do legado:
  - Comunicado
  - Aplicativo
  - Servidor
  - Dica
  - Tutorial
- Migrados 14 conteudos do legado:
  - 13 publicados
  - 1 rascunho
- Autor legado mapeado para o admin novo.
- `/categorias` conectado ao banco real.
- `/posts` conectado ao banco real.
- `/posts` publicado com cards claros, midia em destaque, thumbnail de video, categoria, destaque, data, modal com galeria, copiar texto, compartilhar, links e CTA.
- `/posts` atualizado com chips clicaveis por categoria, contadores, busca por titulo/descricao/conteudo e seletor de status no modelo do legado.
- `/posts` ajustado para visual escuro/dourado do Bradox, com painel para ordenar destaques e campo de data de publicacao no formulario.
- Modal de abertura dos conteudos ajustado para tema escuro/dourado do Bradox, mantendo estrutura inspirada no legado.
- Cards sem imagem ou video agora usam bloco editorial com titulo/resumo/icone da categoria, sem parecer imagem quebrada ou ausente.
- `/categorias` atualizado com selecao visual de icones e cores, sem campos tecnicos de texto para esses atributos.

### Identidade visual

- Logo oficial Bradox Play promovida para `public/bradox-play-logo.png`.
- Login, sidebar, loading autenticado e preview de templates passaram a usar a logo oficial.
- Manifesto PWA, favicon, Apple touch icon e metatags sociais passaram a apontar para a nova marca.

## O que falta

### Alta prioridade

1. Fechar configuracoes de pagamento ponta a ponta:
   - Mercado Pago
   - UpdePix
   - Manual
   - webhook isolado
   - conciliacao de eventos
2. Revisar RLS final por tabela e role.
3. Completar Templates com midia, preview, variaveis e status.
4. Implementar CRUD completo de Redes com bloqueio por dependencias.

### Media prioridade

1. WhatsApp isolado:
   - sessoes
   - fila
   - mensagens
   - webhook
   - midia
   - retry/backoff
2. Portal do cliente:
   - assinatura
   - faturas
   - comprovantes
   - suporte
   - conteudos/tutoriais
3. Portal da revenda:
   - dashboard proprio
   - clientes
   - cobrancas
   - mensagens
4. PWA final:
   - icones
   - cache seguro
   - auto-update
   - tela offline

### Depois da base operacional

1. IA e automacoes inspiradas no Paga Play.
2. Analytics avancado.
3. Observabilidade formal.
4. Backup diario e restore testado.
5. Homologacao por rede piloto.
6. Corte final do `network-hub`.

## Proxima execucao iniciada

### Fase atual - Conteudo e configuracoes

Objetivo: transformar Conteudo e Configuracoes em modulos reais, seguros e prontos para uso operacional.

Escopo iniciado:

- Migrar categorias e conteudos reais do legado para `bradox_revenda`.
- Conectar `/categorias` ao Supabase.
- Conectar `/posts` ao Supabase.
- Suportar upload de imagens em `content-images`.
- Manter delete logico para categorias e posts.

Executado nesta etapa:

- Build publicado em producao com a nova interface de posts.
- `/posts` e `/categorias` validados no dominio publico com HTTP 200.
- Imagem Docker salva como `bradox-revenda-app:latest` apos deploy limpo.
- Barra de categorias, busca e status publicada e validada em producao com HTTP 200.
- Ordenacao manual de destaques publicada; banco validado com 5 destaques numerados de 0 a 4.
- Bucket privado `manual-payment-receipts` criado em producao para comprovantes manuais, com limite de 10 MB e suporte a imagens/PDF.
- Fatura publica publicada com upload real de comprovante no Storage, sem gravar arquivo em base64 no banco.
- Correcao critica de autenticacao publicada: contas nao herdam mais contexto do admin por sessao antiga local; inconsistencias de sessao agora forcam novo login.
- Auditoria de producao confirmada: apenas 1 admin ativo (`thebragafuture@gmail.com`) e sem perfis com e-mail/ID divergente entre `auth.users` e `bradox_revenda.profiles`.
- Configuracoes de pagamento avancaram com validacao obrigatoria por provedor antes de ativar integracao (Manual, Mercado Pago e UpdePix).
- RLS operacional endurecido em producao para admin-only nas tabelas administrativas (`networks`, `servers`, `plans`, `orders`, `message_templates`, `useful_links`, `content`, `payment_provider_settings`, `manual_payment_receipts`).
- Policy de envio anonimo de comprovante manual corrigida para validar `network_id` da fatura no insert.

Proximos passos desta fase:

1. Validar em producao com conta cliente real (luk) que `_app` nao exibe dados administrativos e apenas admin acessa operacao.
2. Testar criacao/edicao/exclusao logica de categoria.
3. Testar criacao/edicao/exclusao logica de post com imagem.
4. Criar uma fatura real pelo fluxo operacional e testar upload/envio de comprovante ponta a ponta.
5. Revisar configuracoes de Mercado Pago e UpdePix com teste real de gateway/webhook (camada de validacao do formulario ja publicada).
6. Registrar evidencias de validacao no plano.

Criterios de aceite:

- Conteudos legados aparecem na tela nova.
- Categorias legadas aparecem com contagem correta de posts.
- Novo post salva no banco e aparece apos reload.
- Upload de imagem gera URL publica no bucket correto.
- Delete nao remove historico fisico, mas some da operacao.
- Configuracoes de pagamento geram fatura utilizavel.

## Fases futuras

### Fase 1 - RLS e seguranca final

- Matriz de policies por tabela.
- Testes com admin, revenda, cliente e anon.
- Remover policies anon temporarias.
- Garantir service role apenas no backend.

### Fase 2 - Pagamentos ponta a ponta

- Mercado Pago real.
- UpdePix real.
- Manual com comprovante e aprovacao.
- Webhook isolado.
- Reprocessamento de eventos.

### Fase 3 - WhatsApp real

- Definir runtime inicial.
- Criar tabelas de sessao, fila, mensagens, eventos e midia.
- Implementar tela de conexao real.
- Implementar worker de envio.

### Fase 4 - Portais

- Portal cliente.
- Portal revenda.
- Policies especificas por papel.
- Pagamentos e suporte pelo portal.

### Fase 5 - IA e automacoes

- Base de conhecimento.
- Funis.
- Handoff.
- Guardrails por rede.
- Runtime integrado ao WhatsApp.

### Fase 6 - Observabilidade, backup e homologacao

- Backup diario.
- Restore testado.
- Uptime Kuma/alertas.
- Checklist de homologacao.
- Rede piloto operando por alguns dias.

### Fase 7 - Corte do legado

- Congelar escrita no legado.
- Rodar delta final.
- Comparar contagens.
- Validar pagamentos e WhatsApp.
- Apontar dominio final.
- Manter legado read-only por periodo definido.

## Riscos atuais

| Risco | Impacto | Mitigacao |
| --- | --- | --- |
| RLS ainda permissivo em pontos temporarios | Exposicao indevida | Revisao por tabela antes do corte. |
| Pagamentos sem webhook final | Conciliacao manual | Priorizar gateways na fase atual. |
| WhatsApp ainda fora do novo runtime | Dependencia do legado | Migrar apos pagamentos/configuracoes estabilizarem. |
| Soft delete confundir auditoria | Dados parecem existir no banco | Views e services devem filtrar `inactive/archived`; hard delete so com politica definida. |
| Conteudo com URLs de imagem antigas | Dependencia de storage legado | Manter URLs por compatibilidade e copiar assets para `content-images` em fase posterior se necessario. |

## Comandos de validacao padrao

```powershell
Set-Location "c:\Users\thebr\OneDrive\Desktop\Projetos\bradox-revenda"
npx tsc --noEmit
npm run build
```

Validacao no VPS:

```bash
curl -sk -o /tmp/bradox-categorias.html -w "categorias=%{http_code}\n" https://bradox-revenda.72.60.252.115.nip.io/categorias
curl -sk -o /tmp/bradox-posts.html -w "posts=%{http_code}\n" https://bradox-revenda.72.60.252.115.nip.io/posts
docker logs --since 5m bradox-revenda-app 2>&1 | grep -E "Error|HTTPError|nao configurado" || true
```
