import { useSession } from '../../hooks/useSession'
import { NavTabs } from '../ui/Tabs'

// Seções da tela Estoque. Produtos (cadastro, preços e custos) só aparece para quem pode gerenciar produtos.
const ITEMS = [
  { to: '/estoque', label: 'Produtos', end: true, modulo: 'produtos' },
  { to: '/estoque/posicao', label: 'Posição atual' },
  { to: '/estoque/historico', label: 'Posição em data' },
  { to: '/estoque/movimentacoes', label: 'Movimentações' },
]

export function EstoqueTabs() {
  const { pode } = useSession()
  return <NavTabs items={ITEMS.filter((item) => !item.modulo || pode(item.modulo))} label="Seções do estoque" />
}
