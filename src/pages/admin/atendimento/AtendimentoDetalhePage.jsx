import { ArrowLeft, UserCheck } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MessageThread } from '../../../components/atendimento/MessageThread'
import { PedidoResumo } from '../../../components/atendimento/PedidoResumo'
import { ReplyBox } from '../../../components/atendimento/ReplyBox'
import { AsyncContent } from '../../../components/ui/AsyncContent'
import { Field } from '../../../components/ui/Field'
import { FormError } from '../../../components/ui/FormError'
import { PageHeader } from '../../../components/ui/PageHeader'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { useAsync } from '../../../hooks/useAsync'
import { useEquipe } from '../../../hooks/useCadastros'
import { useSession } from '../../../hooks/useSession'
import { atendimentoService } from '../../../services/atendimentoService'
import { formatDate, formatDateTime } from '../../../utils/format'
import { statusOptions } from '../../../utils/status'

export function AtendimentoDetalhePage() {
  const { id } = useParams()
  const state = useAsync(() => atendimentoService.obter(id), [id])

  return (
    <>
      <Link to="/atendimento" className="back-link">
        <ArrowLeft size={14} /> Atendimentos
      </Link>
      <AsyncContent state={state} isEmpty={() => false}>
        {(atendimento) => <Detalhe atendimento={atendimento} onUpdate={state.setData} />}
      </AsyncContent>
    </>
  )
}

function Detalhe({ atendimento, onUpdate }) {
  const { usuario } = useSession()
  const equipe = useEquipe().filter((u) => u.papel !== 'OPERADOR')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const concluido = atendimento.status === 'CONCLUIDO'

  async function atualizar(dados) {
    setError(null)
    setSaving(true)
    try {
      onUpdate(await atendimentoService.atualizar(atendimento.id, dados))
    } catch (err) {
      setError(err)
    } finally {
      setSaving(false)
    }
  }

  async function responder(conteudo, { concluir } = {}) {
    let atualizado = await atendimentoService.enviarMensagem(atendimento.id, { conteudo, autorId: usuario.id, autorTipo: 'ATENDENTE' })
    if (concluir) atualizado = await atendimentoService.atualizar(atendimento.id, { status: 'CONCLUIDO' })
    onUpdate(atualizado)
  }

  return (
    <>
      <PageHeader
        eyebrow={`Protocolo ${atendimento.protocolo}`}
        title={atendimento.tipoSolicitacao.titulo}
        description={`Aberto em ${formatDateTime(atendimento.criadoEm)} · ${atendimento.loja?.nome ?? 'Sem loja'}`}
        actions={
          <>
            <StatusBadge type="atendimento" value={atendimento.status} />
            {atendimento.responsavelId !== usuario.id && (
              <button type="button" className="btn btn-secondary" disabled={saving} onClick={() => atualizar({ responsavelId: usuario.id, status: atendimento.status === 'ABERTO' ? 'EM_ANDAMENTO' : undefined })}>
                <UserCheck size={16} /> Assumir atendimento
              </button>
            )}
          </>
        }
      />

      <section className="ticket-layout">
        <div className="card ticket-conversation">
          <div className="card__header">
            <div>
              <h2 className="card__title">Conversa</h2>
              <p className="card__subtitle">{atendimento.mensagens.length} mensagens</p>
            </div>
          </div>
          <div className="ticket-conversation__body">
            <MessageThread mensagens={atendimento.mensagens} nomeCliente={atendimento.cliente.nome} />
          </div>
          <div className="ticket-conversation__reply">
            {concluido ? (
              <p className="subtle">Atendimento concluído. Reabra alterando o status para enviar novas mensagens.</p>
            ) : (
              <ReplyBox
                onSend={responder}
                placeholder={`Responder a ${atendimento.cliente.nome.split(' ')[0]}…`}
                extraAction={{ label: 'Enviar e concluir', opcoes: { concluir: true } }}
              />
            )}
          </div>
        </div>

        <aside className="stack">
          <div className="card">
            <div className="card__header">
              <h2 className="card__title">Gestão</h2>
            </div>
            <div className="card__body stack-sm">
              <Field label="Status">
                <select className="select" value={atendimento.status} disabled={saving} onChange={(e) => atualizar({ status: e.target.value })}>
                  {statusOptions('atendimento').map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Responsável">
                <select
                  className="select"
                  value={atendimento.responsavelId ?? ''}
                  disabled={saving}
                  onChange={(e) => atualizar({ responsavelId: e.target.value ? Number(e.target.value) : null })}
                >
                  <option value="">Sem responsável</option>
                  {equipe.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome}
                    </option>
                  ))}
                </select>
              </Field>
              <FormError error={error} />
            </div>
          </div>

          <div className="card">
            <div className="card__header">
              <h2 className="card__title">Cliente</h2>
            </div>
            <div className="card__body">
              <dl className="details-list">
                <div>
                  <dt>Nome</dt>
                  <dd>{atendimento.cliente.nome}</dd>
                </div>
                <div>
                  <dt>E-mail</dt>
                  <dd>{atendimento.cliente.email}</dd>
                </div>
                <div>
                  <dt>Telefone</dt>
                  <dd className="nowrap">{atendimento.cliente.telefone}</dd>
                </div>
                <div>
                  <dt>Cliente desde</dt>
                  <dd>{formatDate(`${atendimento.cliente.clienteDesde}T12:00:00`)}</dd>
                </div>
                <div>
                  <dt>Histórico</dt>
                  <dd>
                    {atendimento.cliente.totalPedidos} pedidos · {atendimento.cliente.totalAtendimentos} atendimentos
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {atendimento.pedido && (
            <div className="card">
              <div className="card__header">
                <h2 className="card__title">Pedido vinculado</h2>
              </div>
              <div className="card__body">
                <PedidoResumo pedido={atendimento.pedido} />
              </div>
            </div>
          )}
        </aside>
      </section>
    </>
  )
}
