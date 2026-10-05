import { ArrowLeftRight, Boxes, Headset, LayoutDashboard, Shirt, Wallet } from 'lucide-react'

// Itens do menu interno. `modulo` liga cada item às regras de utils/permissions.js.
export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, modulo: 'dashboard' },
  { to: '/estoque', label: 'Estoque', icon: Boxes, modulo: 'estoque' },
  { to: '/produtos', label: 'Produtos', icon: Shirt, modulo: 'produtos' },
  { to: '/transferencias', label: 'Transferências', icon: ArrowLeftRight, modulo: 'transferencias' },
  { to: '/atendimento', label: 'Atendimento', icon: Headset, modulo: 'atendimento' },
  { to: '/financeiro', label: 'Financeiro', icon: Wallet, modulo: 'financeiro' },
]
