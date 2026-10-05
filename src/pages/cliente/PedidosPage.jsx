import { Search } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PedidoResumo } from '../../components/atendimento/PedidoResumo'
import { AsyncContent } from '../../components/ui/AsyncContent'
import { EmptyState } from '../../components/ui/EmptyState'
import { FormError } from '../../components/ui/FormError'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useAsync } from '../../hooks/useAsync'
import { useSession } from '../../hooks/useSession'
import { clienteService } from '../../services/clienteService'
import { formatCurrency, formatDate } from '../../utils/format'

const ETAPAS = [
  { status: 'PROCESSANDO', label: 'Em separação' },
  { status: 'ENVIADO', label: 'Enviado' },
  { status: 'ENTREGUE', label: 'Entregue' },
]

function Progresso({ pedido }) {
  if (pedido.status === 'CANCELADO') return <p className="form-error">Este pedido foi cancelado.</p>
  const atual = ETAPAS.findIndex((e) => e.status === pedido.status)
  return (
    <ol className="progress-steps">
      {ETAPAS.map((etapa, index) => (
        <li key={etapa.status} className={index <= atual ? 'is-done' : ''}>
          <span className="progress-steps__dot" aria-hidden="true" />
          {etapa.label}
        </li>
      ))}
    </ol>
  )
}

export function PedidosPage() {
  const { clienteId } = useSession()
  const pedidos = useAsync(() => clienteService.listarPedidos(clienteId), [clienteId])
  const [numero, setNumero] = useState('')
  const [selecionado, setSelecionado] = useState(null)
  const [buscando, setBuscando] = useState(false)
  const [error, setError] = useState(null)

  async function consultar(event) {
    event.preventDefault()
    if (!numero.trim()) return
    setError(null)
    setBuscando(true)
    try {
      setSelecionado(await clienteService.consultarPedido(clienteId, numero.trim()))
    } catch (err) {
      setSelecionado(null)
      setError(err)
    } finally {
      setBuscando(false)
    }
  }

  return (
    <>
      <div>
        <p className="eyebrow">Pedidos</p>
        <h1 className="client-title">Consultar pedido</h1>
        <p className="muted">Informe o número que aparece no e-mail de confirmação ou na nota fiscal.</p>
      </div>

      <form className="order-search" onSubmit={consultar}>
        <div className="search-input">
          <Search size={16} aria-hidden="true" />
          <input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Ex.: CL-105093" aria-label="Número do pedido" />
        </div>
        <button type="submit" className="btn btn-primary" disabled={buscando}>
          {buscando ? 'Consultando…' : 'Consultar'}
        </button>
      </form>
      <FormError error={error} />

      {selecionado && (
        <section className="card order-detail">
          <div className="card__header">
            <div>
              <h2 className="card__title">Pedido {selecionado.numero}</h2>
              <p className="card__subtitle">Realizado em {formatDate(selecionado.criadoEm)}</p>
            </div>
            <Link to={`/cliente/solicitacoes/nova?pedido=${selecionado.id}`} className="btn btn-secondary btn-sm">
              Preciso de ajuda com este pedido
            </Link>
          </div>
          <div className="card__body stack">
            <Progresso pedido={selecionado} />
            <PedidoResumo pedido={selecionado} />
          </div>
        </section>
      )}

      <section className="stack-sm">
        <div className="section-heading">
          <h2>Seus pedidos</h2>
        </div>
        <AsyncContent state={pedidos} empty={<EmptyState title="Nenhum pedido encontrado" />}>
          {(lista) => (
            <div className="request-list">
              {lista.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`request-card ${selecionado?.id === p.id ? 'is-selected' : ''}`}
                  onClick={() => {
                    setError(null)
                    setSelecionado(p)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                >
                  <div className="request-card__main">
                    <div className="row">
                      <span className="mono subtle">{p.numero}</span>
                      <StatusBadge type="pedido" value={p.status} />
                    </div>
                    <strong>{p.itens.map((i) => i.variacao.produto.nome).join(' · ')}</strong>
                    <span className="subtle">
                      {p.canal}
                      {p.canal === 'Loja física' ? ` · ${p.loja.nome}` : ''}
                    </span>
                  </div>
                  <div className="request-card__side">
                    <strong>{formatCurrency(p.total)}</strong>
                    <span className="subtle">{formatDate(p.criadoEm)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </AsyncContent>
      </section>
    </>
  )
}
