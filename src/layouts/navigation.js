import { ArrowLeftRight, Boxes, Headset, LayoutDashboard, Settings, Shirt, ShoppingBag, Wallet } from 'lucide-react'

// Itens do menu interno, numa lista simples e nesta ordem para todos os cargos.
// `modulo` liga cada item às regras de utils/permissions.js (cada cargo vê só o que pode acessar).
export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, modulo: 'dashboard' },
  { to: '/pedidos', label: 'Pedidos', icon: ShoppingBag, modulo: 'pedidos' },
  { to: '/produtos', label: 'Produtos', icon: Shirt, modulo: 'produtos' },
  { to: '/estoque', label: 'Estoque', icon: Boxes, modulo: 'estoque' },
  { to: '/transferencias', label: 'Transferências', icon: ArrowLeftRight, modulo: 'transferencias' },
  { to: '/atendimento', label: 'Atendimento', icon: Headset, modulo: 'atendimento' },
  { to: '/financeiro', label: 'Financeiro', icon: Wallet, modulo: 'financeiro' },
  { to: '/administracao', label: 'Administração', icon: Settings, modulo: 'administracao' },
]
