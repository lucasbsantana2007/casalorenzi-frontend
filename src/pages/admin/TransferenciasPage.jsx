import { ArrowRight, Plus, Truck } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { TransferenciaModal } from '../../components/estoque/TransferenciaModal'
import { AsyncContent } from '../../components/ui/AsyncContent'
import { DataTable } from '../../components/ui/DataTable'
import { EmptyState } from '../../components/ui/EmptyState'
import { FormError } from '../../components/ui/FormError'
import { PageHeader } from '../../components/ui/PageHeader'
import { SearchInput } from '../../components/ui/SearchInput'
import { StatCard } from '../../components/ui/StatCard'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Tabs } from '../../components/ui/Tabs'
import { useAsync } from '../../hooks/useAsync'
import { useLojas } from '../../hooks/useCadastros'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useSession } from '../../hooks/useSession'
import { transferenciasService } from '../../services/transferenciasService'
import { formatDateTime, formatNumber, formatRelative } from '../../utils/format'
import { statusOptions } from '../../utils/status'

const ACOES = {
  SOLICITADA: [
    { status: 'EM_TRANSITO', label: 'Despachar', className: 'btn-secondary' },
    { status: 'CANCELADA', label: 'Cancelar', className: 'btn-ghost' },
  ],
  EM_TRANSITO: [{ status: 'CONCLUIDA', label: 'Confirmar recebimento', className: 'btn-secondary' }],
}

export function TransferenciasPage() {
  const { usuario } = useSession()
  const lojas = useLojas()
  const [status, setStatus] = useState('')
  const [lojaId, setLojaId] = useState('')
  const [busca, setBusca] = useState('')
  const buscaDebounced = useDebouncedValue(busca)
  const [modalOpen, setModalOpen] = useState(false)
  const [processando, setProcessando] = useState(null)
  const [actionError, setActionError] = useState(null)
  const state = useAsync(() => transferenciasService.listar({ lojaId, busca: buscaDebounced }), [lojaId, buscaDebounced])

  const todas = state.data ?? []
  const contar = (s) => todas.filter((t) => t.status === s).length
  const tabs = [{ value: '', label: 'Todas', count: todas.length }, ...statusOptions('transferencia').map((o) => ({ ...o, count: contar(o.value) }))]

  async function mudarStatus(transferencia, novoStatus) {
    setActionError(null)
    setProcessando(transferencia.id)
    try {
      await transferenciasService.atualizarStatus(transferencia.id, { status: novoStatus, usuarioId: usuario.id })
      state.reload()
    } catch (err) {
      setActionError(err)
    } finally {
      setProcessando(null)
    }
  }

  const columns = [
    {
      key: 'codigo',
      header: 'Transferência',
      render: (t) => (
        <>
          <span className="cell-main mono">{t.codigo}</span>
          <span className="cell-sub nowrap">{formatDateTime(t.criadoEm)}</span>
        </>
      ),
    },
    {
      key: 'item',
      header: 'Produto / SKU',
      render: (t) => (
        <>
          <span className="cell-main">{t.produto.nome}</span>
          <span className="cell-sub">
            {t.variacao.sku} · {t.variacao.cor} · {t.variacao.tamanho}
          </span>
        </>
      ),
    },
    {
      key: 'rota',
      header: 'Origem → Destino',
      render: (t) => (
        <span className="route">
          {t.lojaOrigem.nome} <ArrowRight size={13} aria-label="para" /> {t.lojaDestino.nome}
        </span>
      ),
    },
    { key: 'quantidade', header: 'Qtd.', align: 'right', render: (t) => <span className="qty">{t.quantidade}</span> },
    {
      key: 'pessoas',
      header: 'Responsável',
      render: (t) => (
        <>
          <span className="cell-main nowrap">{t.responsavel?.nome ?? '—'}</span>
          <span className="cell-sub nowrap">Solicitado por {t.solicitante?.nome ?? '—'}</span>
        </>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (t) => (
        <>
          <StatusBadge type="transferencia" value={t.status} />
          {t.status === 'CONCLUIDA' && <span className="cell-sub">recebida {formatRelative(t.recebidoEm)}</span>}
          {t.status === 'EM_TRANSITO' && <span className="cell-sub">enviada {formatRelative(t.enviadoEm)}</span>}
        </>
      ),
    },
    {
      key: 'acoes',
      header: <span className="sr-only">Ações</span>,
      align: 'right',
      render: (t) => (
        <div className="row-actions">
          {(ACOES[t.status] ?? []).map((acao) => (
            <button key={acao.status} type="button" className={`btn btn-sm ${acao.className}`} disabled={processando === t.id} onClick={() => mudarStatus(t, acao.status)}>
              {acao.label}
            </button>
          ))}
        </div>
      ),
    },
  ]

  const visiveis = status ? todas.filter((t) => t.status === status) : todas

  return (
    <>
      <PageHeader
        eyebrow="Operação"
        title="Transferências"
        description="Movimentação de peças entre lojas. O despacho baixa o estoque da origem e o recebimento credita o destino."
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Nova transferência
          </button>
        }
      />

      <section className="kpi-grid kpi-grid--4">
        <StatCard label="Aguardando envio" value={contar('SOLICITADA')} hint="solicitações a despachar" tone={contar('SOLICITADA') ? 'warning' : undefined} />
        <StatCard label="Em trânsito" value={contar('EM_TRANSITO')} hint={`${formatNumber(todas.filter((t) => t.status === 'EM_TRANSITO').reduce((s, t) => s + t.quantidade, 0))} peças a caminho`} />
        <StatCard label="Concluídas" value={contar('CONCLUIDA')} hint="recebidas no destino" />
        <StatCard label="Canceladas" value={contar('CANCELADA')} hint="no período exibido" />
      </section>

      <Tabs items={tabs} value={status} onChange={setStatus} label="Status da transferência" />

      <div className="toolbar">
        <SearchInput value={busca} onChange={setBusca} placeholder="Código, produto ou SKU" />
        <select className="select" value={lojaId} onChange={(e) => setLojaId(e.target.value)} aria-label="Loja">
          <option value="">Todas as lojas</option>
          {lojas.map((l) => (
            <option key={l.id} value={l.id}>
              {l.nome}
            </option>
          ))}
        </select>
        <span className="toolbar__spacer" />
        <Link to="/estoque/movimentacoes" className="link">
          Ver movimentações de estoque
        </Link>
      </div>

      <FormError error={actionError} />

      <AsyncContent state={{ ...state, data: state.data && visiveis }} empty={<EmptyState icon={Truck} title="Nenhuma transferência" description="Não há transferências com os filtros selecionados." />}>
        {(rows) => <DataTable columns={columns} rows={rows} caption="Transferências" />}
      </AsyncContent>

      <TransferenciaModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={state.reload} />
    </>
  )
}
