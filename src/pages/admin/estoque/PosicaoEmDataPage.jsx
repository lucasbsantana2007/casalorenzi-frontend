import { CalendarSearch } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EstoqueTabs } from '../../../components/estoque/EstoqueTabs'
import { AsyncContent } from '../../../components/ui/AsyncContent'
import { DataTable } from '../../../components/ui/DataTable'
import { EmptyState } from '../../../components/ui/EmptyState'
import { PageHeader } from '../../../components/ui/PageHeader'
import { SearchInput } from '../../../components/ui/SearchInput'
import { StatCard } from '../../../components/ui/StatCard'
import { useAsync } from '../../../hooks/useAsync'
import { useLojas } from '../../../hooks/useCadastros'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue'
import { estoqueService } from '../../../services/estoqueService'
import { daysAgoInput, formatDate, formatNumber, formatSigned, todayInput } from '../../../utils/format'

const ATALHOS = [
  { dias: 7, label: 'Há 1 semana' },
  { dias: 14, label: 'Há 2 semanas' },
  { dias: 30, label: 'Há 30 dias' },
  { dias: 60, label: 'Há 60 dias' },
]

const columns = [
  {
    key: 'produto',
    header: 'Produto',
    render: (e) => (
      <>
        <span className="cell-main">{e.produto.nome}</span>
        <span className="cell-sub">
          {e.variacao.cor} · {e.variacao.tamanho}
        </span>
      </>
    ),
  },
  { key: 'sku', header: 'SKU', render: (e) => <span className="mono">{e.variacao.sku}</span> },
  { key: 'loja', header: 'Loja', render: (e) => <span className="nowrap">{e.loja.nome}</span> },
  { key: 'naData', header: 'Saldo na data', align: 'right', render: (e) => <span className="qty">{formatNumber(e.quantidadeNaData)}</span> },
  { key: 'atual', header: 'Saldo atual', align: 'right', render: (e) => formatNumber(e.quantidade) },
  {
    key: 'variacao',
    header: 'Variação',
    align: 'right',
    render: (e) => {
      const diff = e.quantidade - e.quantidadeNaData
      return <span className={diff > 0 ? 'text-success' : diff < 0 ? 'text-danger' : 'muted'}>{diff === 0 ? '—' : formatSigned(diff)}</span>
    },
  },
]

export function PosicaoEmDataPage() {
  const navigate = useNavigate()
  const lojas = useLojas()
  const [data, setData] = useState(daysAgoInput(14))
  const [lojaId, setLojaId] = useState('')
  const [busca, setBusca] = useState('')
  const buscaDebounced = useDebouncedValue(busca)
  const state = useAsync(() => estoqueService.posicaoEmData({ data, lojaId, busca: buscaDebounced }), [data, lojaId, buscaDebounced])
  const nomeLoja = lojas.find((l) => String(l.id) === lojaId)?.nome ?? 'todas as lojas'

  return (
    <>
      <PageHeader
        eyebrow="Operação"
        title="Estoque"
        description="Consulte o saldo de qualquer loja em uma data passada, reconstruído a partir do histórico de movimentações."
      />
      <EstoqueTabs />

      <div className="card query-card">
        <div className="query-card__intro">
          <CalendarSearch size={20} aria-hidden="true" />
          <p>
            Qual era o estoque de <strong>{nomeLoja}</strong> em <strong>{data ? formatDate(`${data}T12:00:00`) : '—'}</strong>?
          </p>
        </div>
        <div className="toolbar">
          <label className="period-filter__date">
            <span>Data de referência</span>
            <input className="input" type="date" value={data} max={todayInput()} onChange={(e) => setData(e.target.value)} />
          </label>
          <div className="segmented" role="group" aria-label="Atalhos de data">
            {ATALHOS.map(({ dias, label }) => (
              <button key={dias} type="button" className={data === daysAgoInput(dias) ? 'is-active' : ''} onClick={() => setData(daysAgoInput(dias))}>
                {label}
              </button>
            ))}
          </div>
          <select className="select" value={lojaId} onChange={(e) => setLojaId(e.target.value)} aria-label="Loja">
            <option value="">Todas as lojas</option>
            {lojas.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nome}
              </option>
            ))}
          </select>
          <SearchInput value={busca} onChange={setBusca} placeholder="Filtrar produto ou SKU" />
        </div>
      </div>

      <AsyncContent state={state} isEmpty={(r) => r.itens.length === 0} empty={<EmptyState title="Nenhum item encontrado" />}>
        {({ itens }) => {
          const totalData = itens.reduce((sum, e) => sum + e.quantidadeNaData, 0)
          const totalAtual = itens.reduce((sum, e) => sum + e.quantidade, 0)
          return (
            <>
              <section className="kpi-grid kpi-grid--4">
                <StatCard label="Peças na data" value={formatNumber(totalData)} hint={formatDate(`${data}T12:00:00`)} />
                <StatCard label="Peças hoje" value={formatNumber(totalAtual)} hint="saldo atual" />
                <StatCard label="Variação" value={formatSigned(totalAtual - totalData)} tone={totalAtual < totalData ? 'danger' : undefined} hint="hoje vs. data consultada" />
                <StatCard label="SKUs zerados na data" value={formatNumber(itens.filter((e) => e.quantidadeNaData === 0).length)} hint={`de ${itens.length} itens`} />
              </section>
              <DataTable columns={columns} rows={itens} pageSize={25} onRowClick={(e) => navigate(`/estoque/${e.id}`)} caption="Posição de estoque na data" />
            </>
          )
        }}
      </AsyncContent>
    </>
  )
}
