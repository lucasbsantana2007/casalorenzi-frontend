import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RequireAccess } from './components/RequireAccess'
import { LoadingState } from './components/ui/LoadingState'
import { AdminLayout } from './layouts/AdminLayout'
import { ClientLayout } from './layouts/ClientLayout'
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
import { ClienteHomePage } from './pages/cliente/ClienteHomePage'
import { MinhasSolicitacoesPage } from './pages/cliente/MinhasSolicitacoesPage'
import { NovaSolicitacaoPage } from './pages/cliente/NovaSolicitacaoPage'
import { PedidosPage } from './pages/cliente/PedidosPage'
import { SolicitacaoDetalhePage } from './pages/cliente/SolicitacaoDetalhePage'

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
      { path: 'lorenzi', ...publica(() => import('./pages/LorenziPage'), 'LorenziPage') },
      { path: 'produto/:id', ...publica(() => import('./pages/ProdutoPage'), 'ProdutoPage') },
      { path: 'checkout', ...publica(() => import('./pages/CheckoutPage'), 'CheckoutPage') },
      { path: 'pedido/confirmado/:numero', ...publica(() => import('./pages/PedidoConfirmadoPage'), 'PedidoConfirmadoPage') },
      { path: 'meus-pedidos', ...publica(() => import('./pages/MeusPedidosPage'), 'MeusPedidosPage') },
      { path: 'meus-pedidos/novo-pin', ...publica(() => import('./pages/NovoPinPage'), 'NovoPinPage') },
    ],
  },
  // Login único (Iniciar sessão): cliente vai para /cliente, equipe para /dashboard
  { path: '/login', ...publica(() => import('./pages/LoginPage'), 'LoginPage') },
  { path: '/login/esqueci-senha', ...publica(() => import('./pages/RecuperarSenhaPage'), 'EsqueciSenhaPage') },
  { path: '/login/nova-senha', ...publica(() => import('./pages/RecuperarSenhaPage'), 'NovaSenhaPage') },
  { path: '/login/equipe', element: <Navigate to="/login" replace /> },
  {
    // Área do cliente: perfil, pedidos e solicitações (exige login de cliente)
    path: '/cliente',
    element: <ClientLayout />,
    children: [
      { index: true, element: <ClienteHomePage /> },
      { path: 'pedidos', element: <PedidosPage /> },
      { path: 'solicitacoes', element: <MinhasSolicitacoesPage /> },
      { path: 'solicitacoes/nova', element: <NovaSolicitacaoPage /> },
      { path: 'solicitacoes/:id', element: <SolicitacaoDetalhePage /> },
      { path: '*', element: <NotFoundPage homePath="/cliente" /> },
    ],
  },
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
