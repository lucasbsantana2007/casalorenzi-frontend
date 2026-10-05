import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RequireAccess } from './components/RequireAccess'
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
import { FinanceiroPage } from './pages/admin/FinanceiroPage'
import { ProdutosPage } from './pages/admin/ProdutosPage'
import { TransferenciasPage } from './pages/admin/TransferenciasPage'
import { ClienteHomePage } from './pages/cliente/ClienteHomePage'
import { MinhasSolicitacoesPage } from './pages/cliente/MinhasSolicitacoesPage'
import { NovaSolicitacaoPage } from './pages/cliente/NovaSolicitacaoPage'
import { PedidosPage } from './pages/cliente/PedidosPage'
import { SolicitacaoDetalhePage } from './pages/cliente/SolicitacaoDetalhePage'

const protegida = (modulo, element) => <RequireAccess modulo={modulo}>{element}</RequireAccess>

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: protegida('dashboard', <DashboardPage />) },
      { path: 'estoque', element: protegida('estoque', <EstoquePage />) },
      { path: 'estoque/historico', element: protegida('estoque', <PosicaoEmDataPage />) },
      { path: 'estoque/movimentacoes', element: protegida('estoque', <MovimentacoesPage />) },
      { path: 'estoque/:id', element: protegida('estoque', <EstoqueDetalhePage />) },
      { path: 'produtos', element: protegida('produtos', <ProdutosPage />) },
      { path: 'transferencias', element: protegida('transferencias', <TransferenciasPage />) },
      { path: 'atendimento', element: protegida('atendimento', <AtendimentosPage />) },
      { path: 'atendimento/:id', element: protegida('atendimento', <AtendimentoDetalhePage />) },
      { path: 'financeiro', element: protegida('financeiro', <FinanceiroPage />) },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
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
])
