import { ShoppingBag } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AsyncContent } from '../../../components/ui/AsyncContent'
import { DataTable } from '../../../components/ui/DataTable'
import { EmptyState } from '../../../components/ui/EmptyState'
import { PageHeader } from '../../../components/ui/PageHeader'
import { SearchInput } from '../../../components/ui/SearchInput'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { Tabs } from '../../../components/ui/Tabs'
import { useAsync } from '../../../hooks/useAsync'
import { useLojas } from '../../../hooks/useCadastros'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue'
import { useSession } from '../../../hooks/useSession'
import { pedidosService } from '../../../services/pedidosService'
import { formatCurrency, formatDate, formatRelative } from '../../../utils/format'
import { aguardaTransferencia } from '../../../utils/pedidos'
import { statusOptions } from '../../../utils/status'

const columns = [
  {
    key: 'numero',
    header: 'Pedido',
    render: (p) => (
      <>
        <span className="cell-main mono">{p.numero}</span>
        <span className="cell-sub">{p.canal}</span>
      </>
    ),
  },
  {
    key: 'cliente',
    header: 'Cliente',
    render: (p) => (
      <>
        <span className="cell-main">{p.contato?.nome ?? '—'}</span>
        <span className="cell-sub">{p.contato?.email}</span>
      </>
    ),
  },
  {
    key: 'itens',
    header: 'Itens',
    align: 'right',
    render: (p) => p.itens.reduce((sum, i) => sum + i.quantidade, 0),
  },
  { key: 'total', header: 'Total', align: 'right', render: (p) => <span className="nowrap">{formatCurrency(p.total)}</span> },
  {
    key: 'loja',
    header: 'Expedição',
    render: (p) => (
      <>
        <span className="nowrap">{p.loja?.nome}</span>
        {aguardaTransferencia(p) && <span className="cell-sub text-warning nowrap">Aguardando transferência</span>}
      </>
    ),
  },
  { key: 'status', header: 'Status', render: (p) => <StatusBadge type="pedido" value={p.status} /> },
  {
    key: 'data',
    header: 'Data',
    render: (p) => (
      <>
        <span className="nowrap">{formatDate(p.criadoEm)}</span>
        <span className="cell-sub nowrap">{formatRelative(p.criadoEm)}</span>
      </>
    ),
  },
]

export function PedidosPage() {
  const navigate = useNavigate()
  const { usuario } = useSession()
  const lojas = useLojas()
  // Lojista e operador veem só os pedidos que a própria loja expede
  const lojaFixa = usuario.papel === 'ADMINISTRADOR' ? null : String(usuario.lojaId)
  const [aba, setAba] = useState('PROCESSANDO')
  const [busca, setBusca] = useState('')
  const [lojaId, setLojaId] = useState(lojaFixa ?? '')
  const [canal, setCanal] = useState('')
  const buscaDebounced = useDebouncedValue(busca)
  const state = useAsync(() => pedidosService.listar({ busca: buscaDebounced, lojaId, canal }), [buscaDebounced, lojaId, canal])

  const todos = state.data ?? []
  const pertence = (p, valor) => valor === 'TODOS' || p.status === valor
  const tabs = [...statusOptions('pedido'), { value: 'TODOS', label: 'Todos' }].map((tab) => ({
    ...tab,
    count: todos.filter((p) => pertence(p, tab.value)).length,
  }))

  return (
    <>
      <PageHeader
        eyebrow="Vendas"
        title="Pedidos"
        description={lojaFixa ? 'Pedidos que a sua loja separa e envia.' : 'Pedidos do e-commerce e das lojas: separação, envio e entrega.'}
      />

      <Tabs items={tabs} value={aba} onChange={setAba} label="Status do pedido" />

      <div className="toolbar">
        <SearchInput value={busca} onChange={setBusca} placeholder="Código, cliente ou e-mail" />
        <select className="select" value={lojaId} onChange={(e) => setLojaId(e.target.value)} disabled={Boolean(lojaFixa)} aria-label="Loja de expedição">
          <option value="">Todas as lojas</option>
          {lojas.map((l) => (
            <option key={l.id} value={l.id}>
              {l.nome}
            </option>
          ))}
        </select>
        <select className="select" value={canal} onChange={(e) => setCanal(e.target.value)} aria-label="Canal">
          <option value="">Todos os canais</option>
          <option value="E-commerce">E-commerce</option>
          <option value="Loja física">Loja física</option>
        </select>
      </div>

      <AsyncContent
        state={{ ...state, data: state.data && todos.filter((p) => pertence(p, aba)) }}
        empty={<EmptyState icon={ShoppingBag} title="Nenhum pedido encontrado" description="Não há pedidos com os filtros selecionados." />}
      >
        {(rows) => <DataTable columns={columns} rows={rows} onRowClick={(p) => navigate(`/pedidos/${p.id}`)} caption="Pedidos" />}
      </AsyncContent>
    </>
  )
}
