# Casa Lorenzi — Frontend

Plataforma integrada de gestão das lojas Casa Lorenzi: dashboard consolidado, estoque por loja e SKU com histórico, produtos, transferências entre lojas, atendimento e portal do cliente.

React 19 · Vite · JavaScript · React Router · lucide-react · motion e @paper-design/shaders-react (página inicial e login). O backend (FastAPI + PostgreSQL) fica em um repositório separado.

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
| `VITE_API_URL`   | `http://127.0.0.1:8000/api` | Endereço da API FastAPI, já com o prefixo `/api`                |
| `VITE_USE_MOCKS` | `true`                  | `true` usa dados de demonstração em memória; `false` usa a API real |
| `VITE_MODO_DEMO` | `true`                  | Selo "Dados de demonstração" no painel e acesso rápido no login (funciona também com a API, que usa as mesmas contas do seed); `false` quando houver dados reais |

As variáveis são lidas somente em `src/config/env.js`.

## Fluxo de acesso e rotas

1. **Loja pública, em estilo editorial.**
   - **`/`:** duas fotos em tela cheia (Masculino e Feminino) e uma seleção curta da estação.
   - **`/colecao/masculino` e `/colecao/feminino`:** coleção com filtro por estação.
   - **`/lojas`:** lista das lojas.
   - **Menu:** Masculino, Feminino, Lojas e Atendimento, com Pedidos e Conta à direita. O acesso da equipe é um link discreto no rodapé.
2. **Dois logins:**
   - **`/login`:** clientes, acessado por "Conta" no topo do site.
   - **`/login/equipe`:** Administrador, Lojista e Operador, acessado por "Acesso da equipe" no rodapé.

   O papel da conta precisa corresponder ao login usado; caso contrário, a tela indica o login certo e não cria a sessão.
3. **Depois do login**, o cliente vai para `/cliente` e a equipe para `/dashboard`. Quem tentou abrir uma página protegida volta para ela depois de entrar.
4. **"Sair"**, nas duas áreas, encerra a sessão e volta para a página inicial.

Com `VITE_USE_MOCKS=true`, cada login oferece acesso rápido de demonstração: a cliente Mariana Costa em `/login`, e Administrador, Lojista e Operador em `/login/equipe`. Qualquer e-mail cadastrado entra com a senha `lorenzi2026`.

| Perfil        | Módulos                                                               |
| ------------- | --------------------------------------------------------------------- |
| Administrador | Dashboard, Estoque, Produtos, Transferências, Atendimento, Financeiro |
| Lojista       | Dashboard (já filtrado pela própria loja), Estoque, Atendimento       |
| Operador      | Dashboard, Estoque, Transferências                                    |
| Cliente       | Área do cliente                                                       |

As regras ficam em `src/utils/permissions.js`. O frontend esconde menus e bloqueia rotas, mas o backend deve validar as mesmas regras.

**Público:** `/`, `/colecao/:genero`, `/lojas`, `/login` e `/login/equipe`.

**Painel interno:** `/dashboard`, `/estoque`, `/estoque/:id` (detalhe + histórico), `/estoque/historico` (posição em uma data passada), `/estoque/movimentacoes`, `/produtos`, `/transferencias`, `/atendimento`, `/atendimento/:id`, `/financeiro`.

**Área do cliente:** `/cliente`, `/cliente/solicitacoes`, `/cliente/solicitacoes/nova`, `/cliente/solicitacoes/:id`, `/cliente/pedidos`.

## Estrutura

```
src/
  config/env.js          leitura das variáveis de ambiente
  services/
    api.js               cliente HTTP único (fetch, erros do FastAPI, token Bearer)
    *Service.js          um serviço por domínio: endpoints reais OU mock (mesma interface)
    mock/                implementação em memória dos mesmos serviços
  data/seed/             dados de demonstração determinísticos (catálogo, pessoas, histórico)
  context/               sessão (login/logout, usuário e permissões)
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

Todas as rotas ficam sob o prefixo **`/api`** (ex.: `GET /api/produtos`), pensando no deploy unificado de frontend e backend. O prefixo já faz parte de `VITE_API_URL`; por isso, os caminhos abaixo e os serviços em `src/services` aparecem sem ele.

Datas em ISO 8601 ou timestamp; filtros de período usam `de`/`ate` no formato `yyyy-mm-dd`. Erros seguem o padrão do FastAPI, `{ "detail": "mensagem" }`, que é exibido ao usuário. As respostas de listagem devem trazer os relacionamentos já expandidos (`produto`, `variacao`, `loja`, `usuario`...), no formato produzido por `src/services/mock/db.js`.

**Autenticação**
- `POST /auth/login` com `{ email, senha }` retorna `{ token, usuario: { id, nome, email, papel, lojaId } }`. Serve para equipe e clientes (`papel: 'CLIENTE'`). Em erro, use HTTP 401 com `detail`.

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
- `GET /produtos?busca&categoria&ativo` (inclui `variacoes[]` e `estoqueTotal`). A vitrine também usa `genero` (`Masculino`/`Feminino`) e `estacao` (`Inverno`/`Verão`/`Atemporal`), e `imagemUrl` quando existir.
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

**Área do cliente** (com o token, os endpoints podem virar `/clientes/me/...`)
- `GET /clientes/{id}`
- `GET /clientes/{id}/atendimentos`
- `GET /clientes/{id}/atendimentos/{atendimentoId}`
- `POST /atendimentos` com `{ clienteId, tipoSolicitacaoId, pedidoId?, descricao }`. `pedidoId` é obrigatório quando o tipo tem `exigeVenda`.
- `GET /clientes/{id}/pedidos`
- `GET /clientes/{id}/pedidos/{numero}`

O token recebido no login é enviado em todas as requisições como `Authorization: Bearer <token>`. "Manter conectado" guarda a sessão no `localStorage`; sem essa opção, ela fica no `sessionStorage` e termina ao fechar o navegador.

## Imagens

As fotos da vitrine (`src/assets/colecao/`) são do [Unsplash](https://unsplash.com/license), de uso livre, e servem só para ilustrar. Quando a API devolver `imagemUrl` nos produtos, ela substitui automaticamente a foto ilustrativa (`src/data/imagensProdutos.js`).
