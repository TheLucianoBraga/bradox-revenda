# Plano para apagar o legado Network Hub

Este arquivo fica somente com o que ainda precisa ser executado. Quando uma entrega for concluida, ela sai da lista ativa e entra no resumo de concluidos no fim do arquivo.

## Regras de execucao

- O `bradox-revenda` nao deve depender do `network-hub` em runtime.
- Campos `legacy_*` sao permitidos apenas para auditoria, reconciliacao e migracao.
- A troca de dominio fica por ultimo, depois de paridade funcional, backup e homologacao.
- Antes de remover qualquer parte do legado, validar dados reais na VPS e manter dump arquivado.

## Em aberto

### P0 - Paridade minima para desligamento

- Finalizar pagamento automatico: checkout/PIX por provedor, webhook HTTP, validacao de assinatura, retry operacional e tela de conciliacao.
- Finalizar WhatsApp isolado no `bradox_revenda`: integrar worker WAHA, webhook HTTP, QR/status real, envio, midias, logs e retries.
- Implementar worker de cobranca/renovacao sem chamar funcoes do `network-hub`.
- Implementar notification hub: eventos, jobs, preferencias, logs, retry e painel de falhas.
- Revisar RLS final por role: admin, revenda, cliente e anon.
- Criar backup/restore testado do banco e storage do novo stack.

### P1 - Funcionalidade operacional

- Implementar envio em massa/campanhas com fila propria.
- Implementar agendamento e regras de grupos no novo runtime.
- Finalizar templates com midia, variaveis, preview e status de uso real.
- Fechar portal cliente: suporte, status operacional e ajustes finais de faturas/comprovantes.
- Fechar portal revenda: clientes, cobrancas, mensagens, relatorios basicos e escopo de rede.
- Criar painel de observabilidade para webhooks, jobs e mensagens.

### P2 - Decisoes de produto e corte final

- Decidir se a Store/Loja sera migrada ou descontinuada.
- Se migrar Store, criar produtos, categorias, cupons, pedidos e checkout no novo schema.
- Se descontinuar Store, exportar dados e remover dependencia das rotas antigas.
- Decidir destino de links de indicacao/referral e registros publicos antigos.
- Rodar homologacao paralela por 7 a 14 dias.
- Trocar dominio final para o novo stack somente depois da homologacao.
- Manter `network-hub` em modo leitura por janela de seguranca antes de apagar containers/rotas/volumes.

## Concluido

- 2026-05-28: Iniciado plano operacional em Markdown para controlar o desligamento do legado sem misturar itens concluidos com pendencias.
- 2026-05-28: Implementado comportamento esperado de voltar com modal aberto: o primeiro voltar fecha o modal, e somente o segundo voltar navega para a pagina anterior.
- 2026-05-28: Reconciliadas categorias de conteudo na VPS. O novo banco passou de 5 para 6 categorias, todas com `legacy_network_hub_id` correto.
- 2026-05-28: Reconciliados conteudos na VPS. Foram importados 13 conteudos faltantes do `network_hub`; os 3 inativos entraram como `draft`. Resultado atual: 27 conteudos no novo, 25 vinculados ao legado e 2 conteudos novos/manuais mantidos sem origem legada.
- 2026-05-28: Criada e aplicada na VPS a fundacao de pagamento automatico. Novas tabelas `payment_gateway_events` e `payment_transactions`, RPCs service-role `register_gateway_payment_event` e `apply_gateway_payment`, indices, RLS e grants. Isso prepara Mercado Pago/UpdePix para webhook e conciliacao sem depender do `network-hub`.
- 2026-05-28: Dashboard do cliente passou a exibir ferramentas/links reais cadastrados na rede ativa.
- 2026-05-28: Implementado navegador interno por abas para links abertos dentro do PWA. O app permanece como aba principal e os links externos abrem em abas fechaveis dentro do proprio PWA.
- 2026-05-28: Criada e aplicada na VPS a fundacao WAHA Plus isolada. Novas tabelas `whatsapp_gateway_settings`, `whatsapp_sessions`, `whatsapp_webhook_events`, `whatsapp_message_queue` e `whatsapp_messages`, com namespace obrigatorio `bradox-revenda_` para nao tocar sessoes de outros projetos no gateway compartilhado.