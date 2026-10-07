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
| `VITE_USE_MOCKS` | `true`                  | `true` usa dados de demonstração salvos no navegador; `false` usa a API real |
| `VITE_MODO_DEMO` | `true`                  | Selo "Dados de demonstração" no painel e acesso rápido no login (funciona também com a API, que usa as mesmas contas do seed); `false` quando houver dados reais |

As variáveis são lidas somente em `src/config/env.js`. O build de produção (`npm run build`) usa
também o `.env.production`, que liga a API real (`VITE_USE_MOCKS=false`) e o modo demonstração.

## Deploy (Vercel)

O site vai para a Vercel e a API, para o Render (passo a passo no README do backend). Faça a API
primeiro, para ter o endereço dela.

1. Na Vercel: **Add New > Project** e importe este repositório. Ela reconhece o Vite sozinha
   (build `npm run build`, pasta `dist`).
2. Em **Environment Variables**, cadastre só `VITE_API_URL` = `https://SUA-API.onrender.com/api`
   (o `.env.production` já define `VITE_USE_MOCKS=false` e `VITE_MODO_DEMO=true`).
3. Faça o deploy e copie o endereço do site (ex.: `https://casalorenzi.vercel.app`). Se for
   diferente do que foi informado ao Render em `CORS_ORIGINS` e `URL_FRONTEND`, corrija lá.

O `vercel.json` faz a Vercel entregar o site em qualquer endereço (`/estoque`, `/cliente/conta`,
`/login/nova-senha?token=...`); sem ele, abrir uma dessas páginas direto ou apertar F5 daria 404.

Este primeiro deploy é uma **demonstração**: o login mostra o acesso rápido e todas as contas usam a
senha de demonstração. Para um uso real, defina `VITE_MODO_DEMO=false` na Vercel e troque as senhas.

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
| Administrador | Dashboard, Estoque, Pedidos, Produtos, Transferências, Atendimento, Financeiro, Administração |
| Lojista       | Dashboard (já filtrado pela própria loja), Estoque, Pedidos, Atendimento       |
| Operador      | Dashboard, Estoque, Pedidos, Transferências                                    |

Lojista e Operador veem os pedidos que a própria loja expede. O menu é uma lista simples, na mesma ordem para todos os cargos (Dashboard, Pedidos, Estoque, Transferências, Atendimento, Financeiro e Administração), e cada cargo vê só os módulos que pode acessar. **Estoque** reúne o cadastro de produtos e o estoque: abas Produtos (só Administrador; é a aba inicial dele), Posição atual, Posição em data e Movimentações. As regras ficam em `src/utils/permissions.js`. O frontend esconde menus e bloqueia rotas, mas o backend deve validar as mesmas regras.

**Público:** `/`, `/colecao/:genero`, `/produto/:id`, `/checkout`, `/pedido/confirmado/:numero`, `/lojas`, `/lorenzi` (história da marca), `/login`, `/login/criar-conta`, `/login/esqueci-senha` e `/login/nova-senha`.

**Área do cliente:** `/cliente` (perfil), `/cliente/pedidos`, `/cliente/solicitacoes`, `/cliente/solicitacoes/nova`, `/cliente/solicitacoes/:id`, `/cliente/conta` (configurações da conta: dados pessoais, senha e exclusão).

**Painel interno:** `/dashboard`, `/estoque` (aba Produtos para o Administrador; os demais cargos vão para a posição atual), `/estoque/posicao` (posição atual por loja e SKU), `/estoque/:id` (detalhe + histórico), `/estoque/historico` (posição em uma data passada), `/estoque/movimentacoes`, `/pedidos`, `/pedidos/:id`, `/transferencias`, `/atendimento`, `/atendimento/:id`, `/financeiro`, `/administracao/funcionarios`, `/administracao/lojas`, `/administracao/frete`, `/administracao/log`. O endereço antigo `/produtos` leva para `/estoque`.

## Estrutura

```
src/
  config/env.js          leitura das variáveis de ambiente
  services/
    api.js               cliente HTTP único (fetch, erros do FastAPI, token Bearer)
    *Service.js          um serviço por domínio: endpoints reais OU mock (mesma interface)
    mock/                implementação dos mesmos serviços com dados salvos no navegador
  data/
    seed/                dados de demonstração determinísticos (catálogo, pessoas, frete, histórico)
    imagensProdutos.js   fotos ilustrativas dos produtos (a foto enviada no cadastro tem prioridade)
    fotosLojas.js, coordenadasLojas.js, mapaBrasil.js   fotos e mapa da página Lojas (pelo id da loja)
  assets/                logo, fotos da coleção, das lojas e do login
  context/               sessão (login/logout, usuário e permissões) e sacola
  hooks/                 useAsync, useDebouncedValue, useSession, useSacola, useCadastros
  layouts/               StoreLayout (loja), AdminLayout + Sidebar (painel) e ClientLayout (área do cliente)
  components/ui/         PageHeader, StatCard, StatusBadge, DataTable, Modal, Tabs, estados...
  components/<domínio>/  loja, home, auth (telas de acesso), produtos, estoque, atendimento, financeiro
  pages/                 loja pública e telas de acesso; pages/admin (painel, incl. administracao/) e pages/cliente
  styles/                tokens e CSS (base, componentes, layout, páginas, loja, checkout, login)
  utils/                 formatação, status, permissões, frete, CPF, margem, imagens, regras de estoque
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

Os mocks guardam as alterações (contas, pedidos, movimentações, transferências, mensagens, produtos, frete, log) no `localStorage`, então elas continuam depois de recarregar a página.

O banco de demonstração tem uma versão (`VERSAO` em `src/services/mock/db.js`). Ao mudar a estrutura dos dados (por exemplo, uma tabela ou um campo novo no seed), suba a versão: cada navegador descarta os dados salvos e recria tudo a partir do seed. Sem isso, quem já abriu o site fica com dados no formato antigo e as telas novas podem quebrar.

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
- `GET /lojas` (público) → `[{ id, nome, cidade, uf, endereco, telefone, horarios: string[], ativa }]`. A página Lojas mostra só as ativas.
- `GET /categorias`
- `GET /usuarios?papel=`
- `GET /tipos-solicitacao?ativo=true`

**Central administrativa** (só Administrador; 403 para os demais cargos; cada alteração grava no log quem fez, a partir do token)
- `GET /admin/funcionarios?busca&papel&lojaId&status` e `POST /admin/funcionarios` com `{ nome, email, papel, lojaId }`. O funcionário novo recebe por e-mail um convite (link de uso único, 7 dias) para criar a senha; antes disso não entra.
- `PUT /admin/funcionarios/{id}`; `PATCH /admin/funcionarios/{id}/status` com `{ ativo }` (422 ao desativar a si mesmo ou o último Administrador ativo); `POST /admin/funcionarios/{id}/convite` reenvia o convite.
- Funcionário desativado recebe 403 no `POST /auth/login` (só depois da senha certa, para não revelar quem é da equipe).
- `GET /admin/lojas`, `POST /admin/lojas` e `PUT /admin/lojas/{id}` com `{ nome, cidade, uf, endereco, telefone, horarios: string[], ativa }`. Loja nova nasce com estoque zerado de todas as variações; loja inativa sai do site e da expedição.
- `GET /admin/log?area&usuarioId&busca` → `[{ area, acao, descricao, alteracoes: [{ campo, de, para }], usuario, criadoEm }]`. Áreas: `FUNCIONARIOS`, `LOJAS`, `FRETE`, `PRODUTOS`, `PEDIDOS`, `TRANSFERENCIAS`, `ESTOQUE`.

**Frete**
- `GET /frete/condicoes` (público) → `{ gratisMinimo, expressoAtivo, regioes: [{ regiao, nome, padrao: { valor, prazoDias }, expresso }] }`, sem custo.
- `GET /frete/config` e `PUT /frete/config` (Administrador): a mesma estrutura com `custo` em cada faixa.
- `POST /frete/simulacao` (Administrador) com `{ cep, subtotal }` → `[{ tipo, label, valor, custo, prazoDias, resultado }]`.
- O pedido guarda o frete com `custo`; só o Administrador recebe o custo no `GET /pedidos/{id}`.

**Dashboard e financeiro**
- `GET /dashboard/resumo?lojaId=` retorna `{ indicadores, resumoPorLoja, alertas, movimentacoesRecentes, atendimentosRecentes }`
- `GET /financeiro/resumo?de&ate&comparar&agrupar&lojas&canais&categorias&generos` (listas separadas por vírgula)

**Pedidos (painel)**
- `GET /pedidos?status&lojaId&canal&busca` e `GET /pedidos/{id}` (com itens, loja de expedição, transferências e histórico). Lojista e Operador veem os pedidos da própria loja.
- `PATCH /pedidos/{id}` com `{ lojaId }` (troca a loja de expedição antes do envio), `{ status: 'ENVIADO', codigoRastreio }`, `{ status: 'ENTREGUE' }` ou `{ status: 'CANCELADO' }` (estorna o pagamento). Cada mudança vai para o log.

**Estoque** (chave: loja + variação)
- `GET /estoque?busca&lojaId&categoria&status&variacaoId`. `status`: `NORMAL | BAIXO | SEM_ESTOQUE | ALERTA` (`ALERTA` = baixo ou zerado)
- `GET /estoque/{id}`
- `GET /estoque/posicao?data&lojaId&busca` retorna `{ data, itens: [...estoque, quantidadeNaData] }`. É o histórico obrigatório: "qual era o estoque da loja X há duas semanas?"
- `GET /movimentacoes?estoqueId&lojaId&tipo&de&ate&busca`
- `POST /movimentacoes` com `{ estoqueId, tipo, quantidade, origem, usuarioId }`. A `quantidade` vai com sinal (positivo entra, negativo sai). O backend atualiza o saldo e grava `saldoResultante`.
- Tipos: `ENTRADA`, `VENDA`, `DEVOLUCAO`, `AJUSTE`, `TRANSFERENCIA_SAIDA`, `TRANSFERENCIA_ENTRADA`

**Produtos**
- `GET /produtos?busca&categoria&ativo` (inclui `variacoes[]` e `estoqueTotal`; `precoCusto` em cada variação **só para o Administrador**). A vitrine também usa `genero` (`Masculino`/`Feminino`) e `estacao` (`Inverno`/`Verão`/`Atemporal`), e `imagemUrl` quando existir.
- `GET /produtos/{id}`
- `POST /produtos` e `PUT /produtos/{id}` (só Administrador) com `{ nome, categoria, precoBase, ativo, genero, estacao, variacoes: [{ id?, sku, tamanho, cor, precoCusto }], imagem?, removerImagem? }`. `genero` (`Masculino` ou `Feminino`) é obrigatório no cadastro e define em qual coleção da loja o produto aparece; `estacao` é `Inverno`, `Verão` ou `Atemporal` (padrão). Produto ativo aparece na vitrine assim que é cadastrado.
- `DELETE /produtos/{id}` (só Administrador) tira o produto da loja, do painel e do estoque; pedidos, vendas e o histórico continuam (o produto fica marcado como removido no banco). HTTP 409 se houver pedido em processamento ou transferência pendente da peça. Na tela Estoque, aba Produtos, é a lixeira ao lado do olho e do lápis. Mudanças de preço, custo e foto vão para o log.
- Foto do produto: `imagem: { nome, tipo, conteudoBase64 }` (JPG, PNG ou WebP, até 2 MB, já reduzida no navegador para no máximo 1280 px) troca a foto; `removerImagem: true` volta à ilustração. O backend grava no S3 e devolve `imagemUrl` no produto (e em `variacao.produto` nos pedidos), que o site usa na vitrine, no carrinho, no checkout e nos pedidos.

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
- `POST /atendimentos` com `{ clienteId, tipoSolicitacaoId, pedidoId?, descricao, anexo? }`. `pedidoId` é obrigatório quando o tipo tem `exigeVenda` e precisa ser um pedido do próprio cliente. `anexo: { nome, tipo, conteudoBase64 }` é uma foto JPG, PNG ou WebP de até 2 MB, já reduzida no navegador; ela fica na primeira mensagem e volta como `anexo: { id, nome, tipo, url }` (`url` pronto para `<img src>`; o arquivo fica no banco, na tabela `anexos`).
- `GET /clientes/{id}/pedidos`
- `GET /clientes/{id}/pedidos/{numero}`

**Configurações da conta** (só o cliente logado, pelo token; tela `/cliente/conta`)
- `GET /conta` → `{ id, nome, email, cpf, telefone, clienteDesde }`
- `PUT /conta` com `{ nome, email, telefone, senhaAtual? }` → mesma resposta. O CPF não muda. Trocar o e-mail (que é o login) exige `senhaAtual`; HTTP 409 se o e-mail já tiver conta.
- `PUT /conta/senha` com `{ senhaAtual, senha, senhaConfirmacao }` → sem corpo (204).
- `POST /conta/exclusao` com `{ senha }` → sem corpo (204). Apaga nome, e-mail, CPF, celular e senha e encerra o acesso; pedidos e solicitações ficam anônimos (a loja precisa deles para fins fiscais). O CPF e o e-mail ficam livres para uma conta nova.
- Senha atual errada responde 422 (não 401, que o site trata como sessão vencida).

O token recebido no login é enviado em todas as requisições como `Authorization: Bearer <token>`. "Manter conectado" guarda a sessão no `localStorage`; sem essa opção, ela fica no `sessionStorage` e termina ao fechar o navegador.

## Imagens

As fotos da vitrine (`src/assets/colecao/`) são do [Unsplash](https://unsplash.com/license), de uso livre, e servem só para ilustrar. As fotos das lojas (`src/assets/lojas/`) e a foto da tela de login (`src/assets/login/`, em duas resoluções) vieram do material da marca. A foto enviada no cadastro do produto (Produtos › Editar › Foto do produto) substitui a ilustração em todo o site (`src/data/imagensProdutos.js`).
