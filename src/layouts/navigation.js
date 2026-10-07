import { ArrowLeftRight, Boxes, Headset, LayoutDashboard, Package, Receipt, Settings, Shirt, ShoppingBag, Wallet } from 'lucide-react'

// Itens do menu interno. `modulo` liga cada item às regras de utils/permissions.js.
export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, modulo: 'dashboard' },
  { to: '/pedidos', label: 'Pedidos', icon: ShoppingBag, modulo: 'pedidos' },
  { to: '/estoque', label: 'Estoque', icon: Boxes, modulo: 'estoque' },
  { to: '/produtos', label: 'Produtos', icon: Shirt, modulo: 'produtos' },
  { to: '/transferencias', label: 'Transferências', icon: ArrowLeftRight, modulo: 'transferencias' },
  { to: '/atendimento', label: 'Atendimento', icon: Headset, modulo: 'atendimento' },
  { to: '/financeiro', label: 'Financeiro', icon: Wallet, modulo: 'financeiro' },
  { to: '/administracao', label: 'Administração', icon: Settings, modulo: 'administracao' },
]

// Menu do Administrador, organizado em grupos que abrem e fecham. Os outros cargos usam a lista simples acima.
// Cada grupo lista os caminhos (to) dos itens de NAV_ITEMS que ficam dentro dele.
export const MENU_ADMINISTRADOR = [
  { to: '/dashboard' },
  { grupo: 'vendas', label: 'Vendas', icon: Receipt, itens: ['/pedidos', '/atendimento', '/financeiro'] },
  { grupo: 'catalogo', label: 'Catálogo e estoque', icon: Package, itens: ['/estoque', '/produtos', '/transferencias'] },
  { to: '/administracao' },
]
