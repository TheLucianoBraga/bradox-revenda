# Auditoria Fase 1 - Base de Dados e Papéis do Network Hub

Data: 2026-05-26  
Fonte: banco legado `supabase-db`, schema `network_hub`  
Destino planejado: `bradox_revenda`

## 1. Resumo executivo

O legado possui 4 redes cadastradas, mas os dados operacionais reais estão quase todos concentrados na rede admin `Braga Digital - Oficial`.

Foram encontrados apenas 2 perfis reais em `network_hub.profiles`: 1 `super_admin` e 1 `cliente`. Não há usuário com role `revenda` em `user_roles`, embora exista 1 cadastro aprovado de tipo `revenda` em `client_registrations`.

Pedidos, pagamentos e assinaturas estão zerados no schema legado auditado. A parte mais relevante para migração imediata é: redes, perfis, user_roles, user_hierarchy, servidores, planos, templates, conteúdos, cadastros de clientes e automações WhatsApp.

## 2. Redes existentes

Total: 4 redes.

| Rede | Slug | Admin? | Observação |
| --- | --- | --- | --- |
| Braga Digital - Oficial | admin | Sim | Rede principal com dados reais |
| Rede Luk Bbraga | rede-luk-bbraga | Não | Sem perfis; possui 1 plano inativo |
| Smart Sollutions | smart-sollutions | Não | Sem perfis; possui 1 plano inativo |
| Rede gpmaster | rede-gpmaster | Não | Sem perfis; possui 1 plano inativo |

Distribuição:

- Redes admin: 1
- Redes não-admin: 3

## 3. Perfis existentes

Total: 2 perfis.

Todos estão vinculados à rede `Braga Digital - Oficial`.

| Nome | Email | Role | Parent |
| --- | --- | --- | --- |
| The Braga Future | thebragafuture@gmail.com | super_admin | vazio |
| Teste Brag | teste@gmail.com | cliente | The Braga Future |

Lacunas:

- Perfis sem rede: 0
- Perfis sem role: 0
- Perfis com role `revenda`: 0

## 4. Roles reais em user_roles

| Role legado | Total |
| --- | ---: |
| super_admin | 1 |
| cliente | 1 |

Mapeamento recomendado para o novo schema:

| Legado | Novo `bradox_revenda.app_role` |
| --- | --- |
| super_admin | admin |
| cliente | cliente |
| revenda_adm ou equivalente futuro | revenda |

Observação: nesta auditoria não apareceu `revenda_adm` nem `revenda` em `network_hub.user_roles`.

## 5. Hierarquia entre admin, revenda e cliente

Total de vínculos em `user_hierarchy`: 1.

| Parent | Role parent | Filho | Role filho |
| --- | --- | --- | --- |
| The Braga Future | super_admin | Teste Brag | cliente |

Leitura operacional:

- Existe apenas uma relação admin -> cliente.
- Não há relação admin -> revenda nem revenda -> cliente nesta base.
- A futura migração de revendas precisa considerar `client_registrations.registration_type = 'revenda'`, pois as revendas não estão materializadas como perfis/roles.

## 6. Clientes por revenda

Não há revenda materializada em `profiles/user_roles`, então não existe contagem real de clientes por revenda via `user_hierarchy`.

Contagem encontrada:

| Parent | Role | Filhos |
| --- | --- | ---: |
| The Braga Future | super_admin | 1 |

Ponto de atenção:

- `client_registrations` contém cadastros aprovados que parecem representar clientes/revendas solicitados, mas nem todos foram convertidos em perfis.

## 7. Cadastros de clientes/revendas

Tabela: `client_registrations`  
Total: 7 registros.

Por status:

| Status | Total |
| --- | ---: |
| approved | 6 |
| rejected | 1 |

Todos vinculados à rede `Braga Digital - Oficial`.

Amostra:

| Nome | Status | Tipo | Owner |
| --- | --- | --- | --- |
| ANDRE KURACIMA | approved | cliente | The Braga Future |
| Smart Sollutions | approved | revenda | The Braga Future |
| Aecio | approved | cliente | The Braga Future |
| Davi gomes belarmino | approved | cliente | The Braga Future |
| gpmaster | approved | cliente | The Braga Future |
| teste | rejected | cliente | The Braga Future |
| Teste Brag | approved | cliente | The Braga Future |

Recomendação:

- Tratar `client_registrations` como fonte complementar para materializar perfis que ainda não existem em `profiles`.
- O registro `Smart Sollutions` é candidato claro a `role = revenda`, mas precisa confirmar se deve virar perfil/rede/revenda no novo projeto.

## 8. Servidores vinculados

Total: 22 servidores.

Todos estão na rede `Braga Digital - Oficial` e todos estão ativos.

Campos importantes encontrados:

- `credit_price`
- `min_credits`
- `settlement_day`
- `requires_image_proof`
- `created_by`

Resumo por rede:

| Rede | Total | Ativos |
| --- | ---: | ---: |
| Braga Digital - Oficial | 22 | 22 |

Exemplos:

| Servidor | Preço crédito | Quantidade mínima | Dia acerto | Ativo |
| --- | ---: | ---: | ---: | --- |
| AllPlay | 6.00 | 15 | vazio | true |
| Aplicativo - Blassed Player | 4.00 | 1 | 19 | true |
| Click | 4.50 | 5 | 15 | true |
| Servidor Brasil | 2.50 | 1 | vazio | true |
| Voltrix | 6.50 | 5 | 8 | true |

Recomendação:

- Migrar `min_credits` para `metadata.min_credits` ou campo explícito `quantidade_minima` no novo projeto.
- Migrar `credit_price` e `settlement_day`, pois ainda não estão modelados de forma completa no destino.

## 9. Planos vinculados

Total: 12 planos.

Por rede:

| Rede | Total | Ativos |
| --- | ---: | ---: |
| Braga Digital - Oficial | 9 | 9 |
| Rede Luk Bbraga | 1 | 0 |
| Rede gpmaster | 1 | 0 |
| Smart Sollutions | 1 | 0 |

Planos ativos principais:

| Plano | Rede | Tipo | Preço | Dias | Ativo |
| --- | --- | --- | ---: | ---: | --- |
| Mensalista Core | Braga Digital - Oficial | cliente | 260.00 | 30 | true |
| Mensalista Pro | Braga Digital - Oficial | cliente | 840.00 | 30 | true |
| Mensalista Scale | Braga Digital - Oficial | cliente | 1600.00 | 30 | true |
| Mensalista Smart | Braga Digital - Oficial | cliente | 480.00 | 30 | true |
| Mensalista Start | Braga Digital - Oficial | cliente | 170.00 | 30 | true |
| Painel Gerador Pro | Braga Digital - Oficial | cliente | 25.00 | 30 | true |
| Painel Gerencia App | Braga Digital - Oficial | cliente | 20.00 | 30 | true |
| Plano Master | Braga Digital - Oficial | revenda | 30.00 | 30 | true |
| Plano Master | Braga Digital - Oficial | pós | 30.00 | 30 | true |

Planos inativos em redes não-admin:

- `Cobrança Admin` em Rede gpmaster
- `Cobrança Admin` em Rede Luk Bbraga
- `Cobrança Admin` em Smart Sollutions

## 10. Cobranças, pedidos, pagamentos e assinaturas

| Tabela | Total |
| --- | ---: |
| orders | 0 |
| payments | 0 |
| subscriptions | 0 |

Conclusão:

- Não há histórico financeiro efetivo nesse schema legado para migrar nesta fase.
- A modelagem financeira do novo projeto ainda precisa ser criada/preparada para dados futuros ou para outro legado, caso exista outra fonte.

## 11. Templates

Total: 4 templates.

Todos estão ativos e vinculados à rede `Braga Digital - Oficial`.

Por tipo:

| Tipo | Total |
| --- | ---: |
| approval | 1 |
| cobranca_pos | 2 |
| welcome | 1 |

Templates:

| Nome | Tipo | Ativo | Tem imagens |
| --- | --- | --- | --- |
| Cadastro Aprovado | approval | true | true |
| Cobrança Pós - Antes do pagamento | cobranca_pos | true | true |
| Cobrança Pós - No dia | cobranca_pos | true | true |
| Aguardando ativação | welcome | true | true |

## 12. Automações e comunicação

### Mensagens agendadas

| Tabela | Total |
| --- | ---: |
| scheduled_messages | 0 |

### Comunicação recorrente

| Item | Total |
| --- | ---: |
| communication_recurring_status | 2 |
| recorrências ativas | 2 |
| communication_recurring_runs | 14 |

Runs por status:

| Status | Total |
| --- | ---: |
| completed | 10 |
| failed | 3 |
| partial | 1 |

Recorrências encontradas:

| Nome | Rede | Ativo | Tipo | Próxima execução |
| --- | --- | --- | --- | --- |
| Plano | Braga Digital - Oficial | true | daily | 2026-04-02 09:00:00+00 |
| teste | Braga Digital - Oficial | true | daily | 2026-04-02 08:42:00+00 |

### WhatsApp cobrança

| Item | Total |
| --- | ---: |
| whatsapp_billing_automation_settings | 1 |
| whatsapp_billing_dispatch_log | 0 |
| whatsapp_billing_renewal_log | 0 |
| user_whatsapp_instances | 1 |

Configuração WhatsApp encontrada:

| Rede | Ativa | Antes vencimento | No vencimento | Após vencimento | Renovação | Target |
| --- | --- | --- | --- | --- | --- | --- |
| Braga Digital - Oficial | true | true | true | false | false | cliente |

Instância WhatsApp:

| Status | Total | Ativa |
| --- | ---: | ---: |
| connecting | 1 | 1 |

## 13. Conteúdo e portal

| Tabela | Total |
| --- | ---: |
| content | 25 |
| content_categories | 6 |

Conteúdo por status:

| Status | Total |
| --- | ---: |
| published | 25 |

Recomendação:

- Migrar `content` e `content_categories` em fase própria de portal/conteúdo, pois há dados reais publicados.

## 14. Lacunas críticas encontradas

1. Não há revendas materializadas em `profiles/user_roles`.
2. Existe pelo menos 1 cadastro aprovado com `registration_type = 'revenda'`, mas ele não virou perfil com role `revenda`.
3. As redes não-admin existem, mas não têm perfis/servidores reais vinculados; apenas planos inativos de cobrança admin.
4. Pedidos, pagamentos e assinaturas estão zerados.
5. A hierarquia atual tem apenas `super_admin -> cliente`.
6. A automação WhatsApp existe, mas os logs de cobrança/renovação estão zerados.
7. A instância WhatsApp está `connecting`, não confirmada como conectada.

## 15. Próximas ações recomendadas

1. Definir regra de materialização de `client_registrations` aprovados em `profiles`.
2. Decidir se `Smart Sollutions` deve virar:
   - perfil `revenda`,
   - rede própria,
   - ou ambos.
3. Criar migration complementar para perfis faltantes a partir de `client_registrations`.
4. Criar migration complementar para roles faltantes.
5. Criar migration complementar para hierarquia correta admin -> revenda -> cliente.
6. Revisar schema destino para guardar `credit_price`, `settlement_day` e `requires_image_proof` de servidores.
7. Planejar migração de conteúdo e categorias.
8. Planejar migração de automações recorrentes e WhatsApp billing.
9. Manter `orders/payments/subscriptions` como vazios nesta origem, salvo se houver outra fonte fora de `network_hub`.