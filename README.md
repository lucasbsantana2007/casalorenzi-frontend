# Casa Lorenzi — Frontend

Plataforma integrada de gestão das lojas Casa Lorenzi: loja online com checkout, dashboard consolidado, estoque por loja e SKU com histórico, pedidos, produtos, transferências entre lojas e atendimento.

React 19 · Vite · JavaScript · React Router · lucide-react · motion · recharts (financeiro). O backend (FastAPI + PostgreSQL) fica em um repositório separado.

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
   - **`/produto/:id`:** página do produto, com escolha de tamanho e cor.
   - **Sacola e `/checkout`:** a sacola abre na lateral; o checkout leva a `/pedido/confirmado/:numero`.
   - **`/lojas`:** lojas no mapa do Brasil.
   - **`/lorenzi`:** parte da história da marca (texto de demonstração, fictício).
   - **Menu:** Masculino, Feminino, Lojas e Lorenzi. À direita, o ícone de pessoa (abre o login; com sessão, leva ao perfil do cliente ou ao painel da equipe) e o carrinho da sacola.
2. **Conta do cliente.** Pode ser criada no login (`/login/criar-conta`) ou no checkout, com nome, CPF, e-mail, celular e senha. Não há compra sem conta. O id do cliente é o CPF.
3. **Login único em `/login`** (Iniciar sessão), para clientes e equipe. Depois de entrar, o cliente vai para o perfil (`/cliente`) e a equipe para a gestão (`/dashboard`), com os módulos do seu cargo. Quem tentou abrir uma página protegida volta para ela depois de entrar. O endereço antigo `/login/equipe` redireciona para `/login`.
4. **"Sair"** encerra a sessão e volta para a página inicial.

Com `VITE_USE_MOCKS=true`, `/login` oferece acesso rápido de demonstração para uma cliente, Administrador, Lojista e Operador. Contas da equipe e clientes de demonstração entram com a senha `lorenzi2026`.

Os endereços antigos `/meus-pedidos` e `/meu-pedido` (acesso por e-mail + PIN, que não existe mais) levam para os pedidos da conta (`/cliente/pedidos`).

| Perfil        | Módulos                                                                        |
| ------------- | ------------------------------------------------------------------------------ |
| Administrador | Dashboard, Estoque, Pedidos, Produtos, Transferências, Atendimento, Financeiro |
| Lojista       | Dashboard (já filtrado pela própria loja), Estoque, Pedidos, Atendimento       |
| Operador      | Dashboard, Estoque, Pedidos, Transferências                                    |

Lojista e Operador veem os pedidos que a própria loja expede. As regras ficam em `src/utils/permissions.js`. O frontend esconde menus e bloqueia rotas, mas o backend deve validar as mesmas regras.

**Público:** `/`, `/colecao/:genero`, `/produto/:id`, `/checkout`, `/pedido/confirmado/:numero`, `/lojas`, `/lorenzi` (história da marca), `/login`, `/login/criar-conta`, `/login/esqueci-senha` e `/login/nova-senha`.

**Área do cliente:** `/cliente` (perfil), `/cliente/pedidos`, `/cliente/solicitacoes`, `/cliente/solicitacoes/nova`, `/cliente/solicitacoes/:id`.

**Painel interno:** `/dashboard`, `/estoque`, `/estoque/:id` (detalhe + histórico), `/estoque/historico` (posição em uma data passada), `/estoque/movimentacoes`, `/pedidos`, `/pedidos/:id`, `/produtos`, `/transferencias`, `/atendimento`, `/atendimento/:id`, `/financeiro`.

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

Os mocks guardam as alterações (contas, pedidos, movimentações, transferências, mensagens, produtos) no `localStorage`, então elas continuam depois de recarregar a página.

## Contrato esperado da API

Todas as rotas ficam sob o prefixo **`/api`** (ex.: `GET /api/produtos`), pensando no deploy unificado de frontend e backend. O prefixo já faz parte de `VITE_API_URL`; por isso, os caminhos abaixo e os serviços em `src/services` aparecem sem ele.

Datas em ISO 8601 ou timestamp; filtros de período usam `de`/`ate` no formato `yyyy-mm-dd`. Erros seguem o padrão do FastAPI, `{ "detail": "mensagem" }`, que é exibido ao usuário. As respostas de listagem devem trazer os relacionamentos já expandidos (`produto`, `variacao`, `loja`, `usuario`...), no formato produzido por `src/services/mock/db.js`.

**Autenticação**
- `POST /auth/login` com `{ email, senha }` retorna `{ token, usuario: { id, nome, email, papel, lojaId } }`. Serve para equipe e clientes (`papel: 'CLIENTE'`). Em erro, use HTTP 401 com `detail`.
- `POST /auth/cadastro` com `{ nome, cpf, email, telefone, senha, senhaConfirmacao }` cria o cliente e retorna o mesmo formato do login. O **id do cliente é o CPF** (11 dígitos, sem pontuação). Senha com no mínimo 8 caracteres, guardada com hash (bcrypt). HTTP 409 se o CPF ou o e-mail já tiverem conta.
- `POST /auth/esqueci-senha` com `{ email }` retorna `{ enviado: true }`, exista ou não a conta (não revela quem tem cadastro). Envia um e-mail com o link `/login/nova-senha?token=...`, válido por 30 minutos e de uso único. Vale para clientes e equipe; limitar tentativas no servidor.
- `POST /auth/redefinir-senha` com `{ token, senha, senhaConfirmacao }` troca a senha e retorna `{ email }`. HTTP 410 se o link expirou ou já foi usado; usar um link invalida os outros pendentes da mesma conta.

**Checkout** (exige cliente logado)
- `POST /checkout` com `{ endereco, freteTipo, pagamento: { metodo, parcelas }, itens: [{ variacaoId, quantidade }] }`. O cliente vem do token, não do corpo; o pedido grava `clienteId` = CPF. HTTP 401 sem sessão de cliente.

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
