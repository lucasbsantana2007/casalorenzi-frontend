import { ArrowLeftRight, History, PackageSearch } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { EstoqueTabs } from '../../../components/estoque/EstoqueTabs'
import { MovimentacaoModal } from '../../../components/estoque/MovimentacaoModal'
import { TransferenciaModal } from '../../../components/estoque/TransferenciaModal'
import { AsyncContent } from '../../../components/ui/AsyncContent'
import { DataTable } from '../../../components/ui/DataTable'
import { EmptyState } from '../../../components/ui/EmptyState'
import { PageHeader } from '../../../components/ui/PageHeader'
import { SearchInput } from '../../../components/ui/SearchInput'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { useAsync } from '../../../hooks/useAsync'
import { useCategorias, useLojas } from '../../../hooks/useCadastros'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue'
import { useSession } from '../../../hooks/useSession'
import { estoqueService } from '../../../services/estoqueService'
import { formatNumber, formatRelative } from '../../../utils/format'

const STATUS_FILTRO = [
  { value: '', label: 'Todos os status' },
  { value: 'ALERTA', label: 'Em alerta (baixo ou zerado)' },
  { value: 'BAIXO', label: 'Estoque baixo' },
  { value: 'SEM_ESTOQUE', label: 'Sem estoque' },
  { value: 'NORMAL', label: 'Normal' },
]

export function EstoquePage() {
  const navigate = useNavigate()
  const { pode } = useSession()
  const lojas = useLojas()
  const categorias = useCategorias()
  // Filtros ficam na URL: links do dashboard abrem a lista já filtrada
  const [params, setParams] = useSearchParams()
  const [busca, setBusca] = useState(params.get('busca') ?? '')
  const buscaDebounced = useDebouncedValue(busca)
  const filtros = { lojaId: params.get('lojaId') ?? '', categoria: params.get('categoria') ?? '', status: params.get('status') ?? '' }
  const [movimentar, setMovimentar] = useState(null)
  const [transferir, setTransferir] = useState(null)

  const state = useAsync(
    () => estoqueService.listar({ ...filtros, busca: buscaDebounced }),
    [filtros.lojaId, filtros.categoria, filtros.status, buscaDebounced],
  )

  function setFiltro(chave, valor) {
    const next = new URLSearchParams(params)
    if (valor) next.set(chave, valor)
    else next.delete(chave)
    setParams(next, { replace: true })
  }

  const columns = [
    {
      key: 'produto',
      header: 'Produto',
      render: (e) => (
        <>
          <span className="cell-main">{e.produto.nome}</span>
          <span className="cell-sub">{e.produto.categoria}</span>
        </>
      ),
    },
    { key: 'sku', header: 'SKU', render: (e) => <span className="mono">{e.variacao.sku}</span> },
    { key: 'tamanho', header: 'Tam.', render: (e) => e.variacao.tamanho },
    { key: 'cor', header: 'Cor', render: (e) => <span className="nowrap">{e.variacao.cor}</span> },
    { key: 'loja', header: 'Loja', render: (e) => <span className="nowrap">{e.loja.nome}</span> },
    {
      key: 'quantidade',
      header: 'Qtd.',
      align: 'right',
      render: (e) => <span className={`qty ${e.status === 'SEM_ESTOQUE' ? 'text-danger' : e.status === 'BAIXO' ? 'text-warning' : ''}`}>{formatNumber(e.quantidade)}</span>,
    },
    { key: 'quantidadeMin', header: 'Mín.', align: 'right', render: (e) => <span className="muted">{e.quantidadeMin}</span> },
    { key: 'status', header: 'Status', render: (e) => <StatusBadge type="estoque" value={e.status} /> },
    { key: 'atualizadoEm', header: 'Atualizado', render: (e) => <span className="nowrap muted">{formatRelative(e.atualizadoEm)}</span> },
    {
      key: 'acoes',
      header: <span className="sr-only">Ações</span>,
      align: 'right',
      render: (e) => (
        <div className="row-actions" onClick={(event) => event.stopPropagation()}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMovimentar(e)}>
            Movimentar
          </button>
          {pode('transferencias') && (
            <button type="button" className="btn btn-ghost btn-icon" onClick={() => setTransferir(e)} aria-label={`Transferir ${e.variacao.sku}`} title="Transferir">
              <ArrowLeftRight size={15} />
            </button>
          )}
          <Link to={`/estoque/${e.id}`} className="btn btn-ghost btn-icon" aria-label={`Histórico de ${e.variacao.sku} em ${e.loja.nome}`} title="Detalhes e histórico">
            <History size={15} />
          </Link>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Operação"
        title="Estoque"
        description="Posição atual por loja e SKU. Clique em um item para ver detalhes e histórico."
        actions={
          pode('transferencias') && (
            <button type="button" className="btn btn-primary" onClick={() => setTransferir({})}>
              <ArrowLeftRight size={16} /> Nova transferência
            </button>
          )
        }
      />
      <EstoqueTabs />

      <div className="toolbar">
        <SearchInput value={busca} onChange={setBusca} placeholder="Buscar produto, SKU ou cor" />
        <select className="select" value={filtros.lojaId} onChange={(e) => setFiltro('lojaId', e.target.value)} aria-label="Loja">
          <option value="">Todas as lojas</option>
          {lojas.map((l) => (
            <option key={l.id} value={l.id}>
              {l.nome}
            </option>
          ))}
        </select>
        <select className="select" value={filtros.categoria} onChange={(e) => setFiltro('categoria', e.target.value)} aria-label="Categoria">
          <option value="">Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select className="select" value={filtros.status} onChange={(e) => setFiltro('status', e.target.value)} aria-label="Status">
          {STATUS_FILTRO.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        {state.data && (
          <span className="toolbar__summary">
            {state.data.length} itens · {formatNumber(state.data.reduce((sum, e) => sum + e.quantidade, 0))} peças
          </span>
        )}
      </div>

      <AsyncContent
        state={state}
        empty={<EmptyState icon={PackageSearch} title="Nenhum item encontrado" description="Ajuste a busca ou os filtros para ver outros itens." />}
      >
        {(itens) => <DataTable columns={columns} rows={itens} onRowClick={(e) => navigate(`/estoque/${e.id}`)} pageSize={25} caption="Posição de estoque" />}
      </AsyncContent>

      <MovimentacaoModal item={movimentar} open={Boolean(movimentar)} onClose={() => setMovimentar(null)} onSaved={state.reload} />
      <TransferenciaModal
        open={Boolean(transferir)}
        onClose={() => setTransferir(null)}
        onSaved={() => navigate('/transferencias')}
        initial={transferir?.id ? { produtoId: transferir.produto.id, variacaoId: transferir.variacaoId, lojaOrigemId: transferir.lojaId } : undefined}
      />
    </>
  )
}
