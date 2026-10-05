import { ArrowLeft, CircleCheck } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { MessageThread } from '../../components/atendimento/MessageThread'
import { PedidoResumo } from '../../components/atendimento/PedidoResumo'
import { ReplyBox } from '../../components/atendimento/ReplyBox'
import { AsyncContent } from '../../components/ui/AsyncContent'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useAsync } from '../../hooks/useAsync'
import { useSession } from '../../hooks/useSession'
import { clienteService, responderSolicitacao } from '../../services/clienteService'
import { formatDateTime } from '../../utils/format'

export function SolicitacaoDetalhePage() {
  const { id } = useParams()
  const location = useLocation()
  const { clienteId } = useSession()
  const state = useAsync(() => clienteService.obterSolicitacao(clienteId, id), [clienteId, id])

  return (
    <>
      <Link to="/cliente/solicitacoes" className="back-link">
        <ArrowLeft size={14} /> Minhas solicitações
      </Link>
      {location.state?.criada && (
        <p className="form-success row" role="status">
          <CircleCheck size={16} aria-hidden="true" /> Solicitação enviada! Guarde o protocolo para acompanhar o atendimento.
        </p>
      )}
      <AsyncContent state={state} isEmpty={() => false}>
        {(s) => (
          <>
            <div className="client-page-header">
              <div>
                <p className="eyebrow">Protocolo {s.protocolo}</p>
                <h1 className="client-title">{s.tipoSolicitacao.titulo}</h1>
                <p className="muted">Aberta em {formatDateTime(s.criadoEm)}</p>
              </div>
              <StatusBadge type="atendimento" value={s.status} />
            </div>

            <section className="client-ticket">
              <div className="card">
                <div className="ticket-conversation__body">
                  <MessageThread mensagens={s.mensagens} perspectiva="CLIENTE" nomeCliente={s.cliente.nome} />
                </div>
                <div className="ticket-conversation__reply">
                  {s.status === 'CONCLUIDO' ? (
                    <p className="subtle">Esta solicitação foi concluída. Se precisar de algo mais, abra uma nova solicitação.</p>
                  ) : (
                    <ReplyBox
                      placeholder="Escreva uma mensagem para a equipe…"
                      onSend={async (texto) => state.setData(await responderSolicitacao(s.id, clienteId, texto))}
                    />
                  )}
                </div>
              </div>
              {s.pedido && (
                <aside className="card">
                  <div className="card__header">
                    <h2 className="card__title">Pedido vinculado</h2>
                  </div>
                  <div className="card__body">
                    <PedidoResumo pedido={s.pedido} />
                  </div>
                </aside>
              )}
            </section>
          </>
        )}
      </AsyncContent>
    </>
  )
}
