# Casa Lorenzi — Frontend

Plataforma integrada de gestão das lojas Casa Lorenzi: dashboard consolidado, estoque por loja e SKU com histórico, produtos, transferências entre lojas, atendimento e portal do cliente.

React 19 · Vite · JavaScript · React Router · lucide-react. O backend (FastAPI + PostgreSQL) fica em um repositório separado.

## Como rodar

```bash
npm install
cp .env.example .env   # opcional; os valores padrão já funcionam
npm run dev            # http://localhost:5173
npm run lint
npm run build
```

### Variáveis de ambiente

| Variável         | Padrão                  | Descrição                                                          |
| ---------------- | ----------------------- | ------------------------------------------------------------------ |
| `VITE_API_URL`   | `http://127.0.0.1:8000` | Endereço da API FastAPI                                             |
| `VITE_USE_MOCKS` | `true`                  | `true` usa dados de demonstração em memória; `false` usa a API real |

As variáveis são lidas somente em `src/config/env.js`.

## Perfis e rotas

O seletor **Perfil de acesso (demo)**, no rodapé do menu, alterna entre Administrador, Lojista e Operador. As regras de acesso ficam em `src/utils/permissions.js`. O frontend esconde menus e bloqueia rotas, mas o backend deve validar as mesmas regras.

| Perfil        | Módulos                                                           |
| ------------- | ----------------------------------------------------------------- |
| Administrador | Dashboard, Estoque, Produtos, Transferências, Atendimento, Financeiro |
| Lojista       | Dashboard (já filtrado pela própria loja), Estoque, Atendimento    |
| Operador      | Dashboard, Estoque, Transferências                                 |

**Painel interno:** `/dashboard`, `/estoque`, `/estoque/:id` (detalhe + histórico), `/estoque/historico` (posição em uma data passada), `/estoque/movimentacoes`, `/produtos`, `/transferencias`, `/atendimento`, `/atendimento/:id`, `/financeiro`.

**Portal do cliente:** `/cliente`, `/cliente/solicitacoes`, `/cliente/solicitacoes/nova`, `/cliente/solicitacoes/:id`, `/cliente/pedidos`.

## Estrutura

```
src/
  config/env.js          leitura das variáveis de ambiente
  services/
    api.js               cliente HTTP único (fetch, erros do FastAPI, token Bearer)
    *Service.js          um serviço por domínio: endpoints reais OU mock (mesma interface)
    mock/                implementação em memória dos mesmos serviços
  data/seed/             dados de demonstração determinísticos (catálogo, pessoas, histórico)
  context/               sessão simulada (usuário e perfil)
  hooks/                 useAsync, useDebouncedValue, useSession, useCadastros
  layouts/               AdminLayout (sidebar) e ClientLayout (portal)
  components/ui/         PageHeader, StatCard, StatusBadge, DataTable, Modal, Tabs, estados...
  components/<domínio>/  modais e componentes de estoque, produtos e atendimento
  pages/admin, pages/cliente
  styles/                tokens e CSS (base, componentes, layout, páginas)
  utils/                 formatação, status, permissões, regras de estoque
```

### Troca de mock para API real

Cada serviço define os endpoints reais e usa o mock apenas quando `VITE_USE_MOCKS=true`:

```js
export const estoqueService = USE_MOCKS ? mock : {
  listar: (filtros) => api.get('/estoque', filtros),
  ...
}
```

Para conectar o backend, defina `VITE_USE_MOCKS=false`. As páginas não mudam. Para ligar um domínio de cada vez, troque o ternário só no serviço correspondente.

Os mocks mantêm alterações (movimentações, transferências, mensagens, produtos) até a página ser recarregada.

## Contrato esperado da API

Datas em ISO 8601 ou timestamp; filtros de período usam `de`/`ate` no formato `yyyy-mm-dd`. Erros seguem o padrão do FastAPI, `{ "detail": "mensagem" }`, que é exibido ao usuário. As respostas de listagem devem trazer os relacionamentos já expandidos (`produto`, `variacao`, `loja`, `usuario`...), no formato produzido por `src/services/mock/db.js`.

**Cadastros**
- `GET /lojas`
- `GET /categorias`
- `GET /usuarios?papel=`
- `GET /tipos-solicitacao?ativo=true`

**Dashboard e financeiro**
- `GET /dashboard/resumo?lojaId=` retorna `{ indicadores, resumoPorLoja, alertas, movimentacoesRecentes, atendimentosRecentes }`
- `GET /financeiro/resumo`

**Estoque** (chave: loja + variação)
- `GET /estoque?busca&lojaId&categoria&status&variacaoId`. `status`: `NORMAL | BAIXO | SEM_ESTOQUE | ALERTA` (`ALERTA` = baixo ou zerado)
- `GET /estoque/{id}`
- `GET /estoque/posicao?data&lojaId&busca` retorna `{ data, itens: [...estoque, quantidadeNaData] }`. É o histórico obrigatório: "qual era o estoque da loja X há duas semanas?"
- `GET /movimentacoes?estoqueId&lojaId&tipo&de&ate&busca`
- `POST /movimentacoes` com `{ estoqueId, tipo, quantidade, origem, usuarioId }`. A `quantidade` vai com sinal (positivo entra, negativo sai). O backend atualiza o saldo e grava `saldoResultante`.
- Tipos: `ENTRADA`, `VENDA`, `DEVOLUCAO`, `AJUSTE`, `TRANSFERENCIA_SAIDA`, `TRANSFERENCIA_ENTRADA`

**Produtos**
- `GET /produtos?busca&categoria&ativo` (inclui `variacoes[]` e `estoqueTotal`)
- `GET /produtos/{id}`
- `POST /produtos` e `PUT /produtos/{id}` com `{ nome, categoria, precoBase, ativo, variacoes: [{ id?, sku, tamanho, cor }] }`

**Transferências**
- `GET /transferencias?status&lojaId&busca`
- `POST /transferencias` com `{ variacaoId, lojaOrigemId, lojaDestinoId, quantidade, observacao, usuarioId }`. Cria com status `SOLICITADA`.
- `PATCH /transferencias/{id}` com `{ status, usuarioId }`. Fluxo:
  - `SOLICITADA` → `EM_TRANSITO`: baixa na origem.
  - `EM_TRANSITO` → `CONCLUIDA`: entrada no destino.
  - `SOLICITADA` → `CANCELADA`.

**Atendimento (interno)**
- `GET /atendimentos?busca&tipoSolicitacaoId&responsavelId&lojaId`. `responsavelId=nenhum` traz os atendimentos sem responsável.
- `GET /atendimentos/{id}` (com `cliente`, `pedido` e `mensagens`)
- `PATCH /atendimentos/{id}` com `{ status?, responsavelId? }`
- `POST /atendimentos/{id}/mensagens` com `{ conteudo, autorId, autorTipo }`
- Status: `ABERTO`, `EM_ANDAMENTO`, `AGUARDANDO_CLIENTE`, `CONCLUIDO`

**Portal do cliente** (quando houver autenticação, os endpoints podem virar `/clientes/me/...`)
- `GET /clientes/{id}`
- `GET /clientes/{id}/atendimentos`
- `GET /clientes/{id}/atendimentos/{atendimentoId}`
- `POST /atendimentos` com `{ clienteId, tipoSolicitacaoId, pedidoId?, descricao }`. `pedidoId` é obrigatório quando o tipo tem `exigeVenda`.
- `GET /clientes/{id}/pedidos`
- `GET /clientes/{id}/pedidos/{numero}`

**Autenticação (próximo passo):** `api.js` já envia `Authorization: Bearer <token>` se houver um token salvo em `localStorage` (`casalorenzi.token`). O `SessionProvider` deve passar a obter o usuário por algo como `GET /auth/me`.
