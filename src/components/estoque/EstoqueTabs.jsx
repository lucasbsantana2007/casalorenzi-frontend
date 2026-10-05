import { NavTabs } from '../ui/Tabs'

const ITEMS = [
  { to: '/estoque', label: 'Posição atual', end: true },
  { to: '/estoque/historico', label: 'Posição em data' },
  { to: '/estoque/movimentacoes', label: 'Movimentações' },
]

export function EstoqueTabs() {
  return <NavTabs items={ITEMS} label="Seções do estoque" />
}
