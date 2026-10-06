import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RequireAccess } from './components/RequireAccess'
import { LoadingState } from './components/ui/LoadingState'
import { AdminLayout } from './layouts/AdminLayout'
import { NotFoundPage } from './pages/NotFoundPage'
import { AtendimentoDetalhePage } from './pages/admin/atendimento/AtendimentoDetalhePage'
import { AtendimentosPage } from './pages/admin/atendimento/AtendimentosPage'
import { DashboardPage } from './pages/admin/DashboardPage'
import { EstoqueDetalhePage } from './pages/admin/estoque/EstoqueDetalhePage'
import { EstoquePage } from './pages/admin/estoque/EstoquePage'
import { MovimentacoesPage } from './pages/admin/estoque/MovimentacoesPage'
import { PosicaoEmDataPage } from './pages/admin/estoque/PosicaoEmDataPage'
import { PedidoDetalhePage } from './pages/admin/pedidos/PedidoDetalhePage'
import { PedidosPage as PedidosAdminPage } from './pages/admin/pedidos/PedidosPage'
import { ProdutosPage } from './pages/admin/ProdutosPage'
import { TransferenciasPage } from './pages/admin/TransferenciasPage'

const protegida = (modulo, element) => <RequireAccess modulo={modulo}>{element}</RequireAccess>

// Páginas públicas carregadas sob demanda: o shader e as animações ficam fora do pacote principal
const publica = (carregar, nome) => ({
  hydrateFallbackElement: <LoadingState />,
  lazy: async () => ({ Component: (await carregar())[nome] }),
})

export const router = createBrowserRouter([
  {
    // Loja pública: início, coleções e lojas
    ...publica(() => import('./layouts/StoreLayout'), 'StoreLayout'),
    children: [
      { index: true, ...publica(() => import('./pages/HomePage'), 'HomePage') },
      { path: 'colecao/:genero', ...publica(() => import('./pages/ColecaoPage'), 'ColecaoPage') },
      { path: 'lojas', ...publica(() => import('./pages/LojasPage'), 'LojasPage') },
      { path: 'produto/:id', ...publica(() => import('./pages/ProdutoPage'), 'ProdutoPage') },
      { path: 'checkout', ...publica(() => import('./pages/CheckoutPage'), 'CheckoutPage') },
      { path: 'pedido/confirmado/:numero', ...publica(() => import('./pages/PedidoConfirmadoPage'), 'PedidoConfirmadoPage') },
      { path: 'meus-pedidos', ...publica(() => import('./pages/MeusPedidosPage'), 'MeusPedidosPage') },
      { path: 'meus-pedidos/novo-pin', ...publica(() => import('./pages/NovoPinPage'), 'NovoPinPage') },
    ],
  },
  // Clientes não têm login: pedidos e atendimento ficam em "Meus pedidos" (e-mail + PIN)
  { path: '/login', element: <Navigate to="/meus-pedidos" replace /> },
  { path: '/login/equipe', ...publica(() => import('./pages/LoginPage'), 'LoginEquipePage') },
  {
    // Painel interno (exige login da equipe)
    element: <AdminLayout />,
    children: [
      { path: 'dashboard', element: protegida('dashboard', <DashboardPage />) },
      { path: 'estoque', element: protegida('estoque', <EstoquePage />) },
      { path: 'estoque/historico', element: protegida('estoque', <PosicaoEmDataPage />) },
      { path: 'estoque/movimentacoes', element: protegida('estoque', <MovimentacoesPage />) },
      { path: 'estoque/:id', element: protegida('estoque', <EstoqueDetalhePage />) },
      { path: 'pedidos', element: protegida('pedidos', <PedidosAdminPage />) },
      { path: 'pedidos/:id', element: protegida('pedidos', <PedidoDetalhePage />) },
      { path: 'produtos', element: protegida('produtos', <ProdutosPage />) },
      { path: 'transferencias', element: protegida('transferencias', <TransferenciasPage />) },
      { path: 'atendimento', element: protegida('atendimento', <AtendimentosPage />) },
      { path: 'atendimento/:id', element: protegida('atendimento', <AtendimentoDetalhePage />) },
      {
        // Carregada sob demanda: os gráficos (recharts) ficam fora do pacote principal
        path: 'financeiro',
        hydrateFallbackElement: <LoadingState />,
        lazy: async () => {
          const { FinanceiroPage } = await import('./pages/admin/FinanceiroPage')
          return { element: protegida('financeiro', <FinanceiroPage />) }
        },
      },
    ],
  },
  { path: '/cliente/*', element: <Navigate to="/meus-pedidos" replace /> },
  { path: '/meu-pedido', element: <Navigate to="/meus-pedidos" replace /> },
  {
    path: '*',
    element: (
      <main className="standalone-page">
        <NotFoundPage homePath="/" />
      </main>
    ),
  },
])
