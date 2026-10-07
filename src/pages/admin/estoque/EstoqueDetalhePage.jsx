import { ArrowLeft, ArrowLeftRight, History, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { MovimentacaoModal } from '../../../components/estoque/MovimentacaoModal'
import { MovimentacoesTable } from '../../../components/estoque/MovimentacoesTable'
import { PeriodoFilter } from '../../../components/estoque/PeriodoFilter'
import { TransferenciaModal } from '../../../components/estoque/TransferenciaModal'
import { AsyncContent } from '../../../components/ui/AsyncContent'
import { EmptyState } from '../../../components/ui/EmptyState'
import { PageHeader } from '../../../components/ui/PageHeader'
import { StatCard } from '../../../components/ui/StatCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { useAsync } from '../../../hooks/useAsync'
import { useSession } from '../../../hooks/useSession'
import { estoqueService } from '../../../services/estoqueService'
import { TIPOS_MOVIMENTACAO } from '../../../utils/estoque'
import { daysAgoInput, formatDateTime, formatNumber, formatSigned, todayInput } from '../../../utils/format'

export function EstoqueDetalhePage() {
  const { id } = useParams()
  const state = useAsync(() => estoqueService.obter(id), [id])

  return (
    <>
      <Link to="/estoque/posicao" className="back-link">
        <ArrowLeft size={14} /> Posição atual
      </Link>
      <AsyncContent state={state} isEmpty={() => false}>
        {(item) => <Detalhe item={item} onChange={state.reload} />}
      </AsyncContent>
    </>
  )
}

function Detalhe({ item, onChange }) {
  const { pode } = useSession()
  const navigate = useNavigate()
  const [modal, setModal] = useState(null)
  const [versao, setVersao] = useState(0)
  const tom = { SEM_ESTOQUE: 'danger', BAIXO: 'warning' }[item.status]

  const atualizar = () => {
    onChange()
    setVersao((v) => v + 1)
  }

  return (
    <>
      <PageHeader
        eyebrow={item.loja.nome}
        title={item.produto.nome}
        description={
          <>
            <span className="mono">{item.variacao.sku}</span> · {item.variacao.cor} · Tamanho {item.variacao.tamanho} · {item.produto.categoria}
          </>
        }
        actions={
          <>
            {pode('transferencias') && (
              <button type="button" className="btn btn-secondary" onClick={() => setModal('transferencia')}>
                <ArrowLeftRight size={16} /> Transferir
              </button>
            )}
            <button type="button" className="btn btn-primary" onClick={() => setModal('movimentacao')}>
              <Plus size={16} /> Registrar movimentação
            </button>
          </>
        }
      />

      <section className="kpi-grid kpi-grid--4">
        <StatCard label="Saldo atual" value={formatNumber(item.quantidade)} hint="unidades na loja" tone={tom} />
        <StatCard label="Estoque mínimo" value={formatNumber(item.quantidadeMin)} hint="ponto de reposição" />
        <div className="card stat-card">
          <span className="stat-card__label">Status</span>
          <div className="stat-card__badge">
            <StatusBadge type="estoque" value={item.status} />
          </div>
          <span className="stat-card__hint">{item.status === 'NORMAL' ? 'Acima do mínimo' : 'Avalie reposição ou transferência'}</span>
        </div>
        <StatCard label="Última atualização" value={<span className="stat-card__value--sm">{formatDateTime(item.atualizadoEm)}</span>} />
      </section>

      <section className="detail-grid">
        <Historico key={versao} estoqueId={item.id} />
        <Disponibilidade item={item} versao={versao} />
      </section>

      <MovimentacaoModal item={modal === 'movimentacao' ? item : null} open={modal === 'movimentacao'} onClose={() => setModal(null)} onSaved={atualizar} />
      <TransferenciaModal
        open={modal === 'transferencia'}
        onClose={() => setModal(null)}
        onSaved={() => navigate('/transferencias')}
        initial={{ produtoId: item.produto.id, variacaoId: item.variacaoId, lojaOrigemId: item.lojaId }}
      />
    </>
  )
}

function Historico({ estoqueId }) {
  const [periodo, setPeriodo] = useState(() => ({ de: daysAgoInput(30), ate: todayInput() }))
  const [tipo, setTipo] = useState('')
  const state = useAsync(() => estoqueService.listarMovimentacoes({ estoqueId, tipo, ...periodo }), [estoqueId, tipo, periodo.de, periodo.ate])

  const movs = state.data ?? []
  const entradas = movs.filter((m) => m.quantidade > 0).reduce((sum, m) => sum + m.quantidade, 0)
  const saidas = movs.filter((m) => m.quantidade < 0).reduce((sum, m) => sum + m.quantidade, 0)
  // Lista vem da mais recente para a mais antiga
  const saldoInicial = !tipo && movs.length ? movs.at(-1).saldoResultante - movs.at(-1).quantidade : null
  const saldoFinal = !tipo && movs.length ? movs[0].saldoResultante : null

  return (
    <div className="card">
      <div className="card__header">
        <div>
          <h2 className="card__title row">
            <History size={16} aria-hidden="true" /> Histórico do item
          </h2>
          <p className="card__subtitle">Cada movimentação registra o saldo resultante, permitindo reconstruir o estoque em qualquer data.</p>
        </div>
      </div>
      <div className="card__body stack-sm">
        <div className="toolbar">
          <PeriodoFilter de={periodo.de} ate={periodo.ate} onChange={setPeriodo} />
          <select className="select" value={tipo} onChange={(e) => setTipo(e.target.value)} aria-label="Tipo de movimentação">
            <option value="">Todos os tipos</option>
            {Object.entries(TIPOS_MOVIMENTACAO).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        {state.data && (
          <dl className="period-summary">
            {saldoInicial !== null && (
              <div>
                <dt>Saldo no início</dt>
                <dd>{formatNumber(saldoInicial)}</dd>
              </div>
            )}
            <div>
              <dt>Entradas</dt>
              <dd className="text-success">{formatSigned(entradas)}</dd>
            </div>
            <div>
              <dt>Saídas</dt>
              <dd className="text-danger">{formatSigned(saidas)}</dd>
            </div>
            {saldoFinal !== null && (
              <div>
                <dt>Saldo no fim</dt>
                <dd>{formatNumber(saldoFinal)}</dd>
              </div>
            )}
            <div>
              <dt>Registros</dt>
              <dd>{movs.length}</dd>
            </div>
          </dl>
        )}
      </div>
      <AsyncContent state={state} empty={<EmptyState title="Sem movimentações no período" description="Amplie o intervalo de datas para ver registros anteriores." />}>
        {(rows) => <MovimentacoesTable rows={rows} showItem={false} pageSize={15} />}
      </AsyncContent>
    </div>
  )
}

function Disponibilidade({ item, versao }) {
  const state = useAsync(() => estoqueService.listar({ variacaoId: item.variacaoId }), [item.variacaoId, versao])
  return (
    <div className="card">
      <div className="card__header">
        <div>
          <h2 className="card__title">Disponibilidade na rede</h2>
          <p className="card__subtitle">Mesmo SKU nas outras lojas</p>
        </div>
      </div>
      <AsyncContent state={state}>
        {(itens) => (
          <ul className="availability">
            {itens.map((e) => (
              <li key={e.id} className={e.id === item.id ? 'is-current' : undefined}>
                <Link to={`/estoque/${e.id}`}>
                  <span>
                    <strong>{e.loja.nome}</strong>
                    {e.id === item.id && <span className="subtle"> · esta loja</span>}
                  </span>
                  <span className="row">
                    <span className="qty">{formatNumber(e.quantidade)}</span>
                    <StatusBadge type="estoque" value={e.status} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </AsyncContent>
    </div>
  )
}
