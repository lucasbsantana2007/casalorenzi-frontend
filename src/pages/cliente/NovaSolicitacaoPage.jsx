import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AsyncContent } from '../../components/ui/AsyncContent'
import { Field } from '../../components/ui/Field'
import { FormError } from '../../components/ui/FormError'
import { useAsync } from '../../hooks/useAsync'
import { useSession } from '../../hooks/useSession'
import { cadastrosService } from '../../services/cadastrosService'
import { clienteService } from '../../services/clienteService'
import { formatCurrency, formatDate } from '../../utils/format'

export function NovaSolicitacaoPage() {
  const tipos = useAsync(() => cadastrosService.listarTiposSolicitacao(), [])
  return (
    <>
      <Link to="/cliente/solicitacoes" className="back-link">
        <ArrowLeft size={14} /> Minhas solicitações
      </Link>
      <div>
        <p className="eyebrow">Atendimento</p>
        <h1 className="client-title">Nova solicitação</h1>
        <p className="muted">Conte o que aconteceu. Nossa equipe responde em até 1 dia útil.</p>
      </div>
      <AsyncContent state={tipos}>{(lista) => <Formulario tipos={lista} />}</AsyncContent>
    </>
  )
}

function Formulario({ tipos }) {
  const navigate = useNavigate()
  const { clienteId } = useSession()
  const [params] = useSearchParams()
  const pedidos = useAsync(() => clienteService.listarPedidos(clienteId), [clienteId]).data ?? []
  const [tipoId, setTipoId] = useState(null)
  const [pedidoId, setPedidoId] = useState(params.get('pedido') ?? '')
  const [descricao, setDescricao] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const tipo = tipos.find((t) => t.id === tipoId)

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const criada = await clienteService.abrirSolicitacao({
        clienteId,
        tipoSolicitacaoId: tipoId,
        pedidoId: tipo?.exigeVenda && pedidoId ? Number(pedidoId) : null,
        descricao,
      })
      navigate(`/cliente/solicitacoes/${criada.id}`, { state: { criada: true } })
    } catch (err) {
      setError(err)
      setSaving(false)
    }
  }

  return (
    <form className="client-form" onSubmit={handleSubmit}>
      <fieldset className="client-form__step">
        <legend>
          <span className="step-number">1</span> Qual é o assunto?
        </legend>
        <div className="option-grid">
          {tipos.map((t) => (
            <label key={t.id} className={`option-card ${tipoId === t.id ? 'is-selected' : ''}`}>
              <input type="radio" name="tipo" value={t.id} checked={tipoId === t.id} onChange={() => setTipoId(t.id)} className="sr-only" required />
              <span className="option-card__category">{t.categoria}</span>
              <strong>{t.titulo}</strong>
              <span>{t.descricao}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {tipo?.exigeVenda && (
        <fieldset className="client-form__step">
          <legend>
            <span className="step-number">2</span> Sobre qual pedido?
          </legend>
          <Field label="Pedido" hint="Este tipo de solicitação precisa estar vinculado a uma compra.">
            <select className="select" value={pedidoId} onChange={(e) => setPedidoId(e.target.value)} required>
              <option value="">Selecione o pedido…</option>
              {pedidos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.numero} · {formatDate(p.criadoEm)} · {p.itens.map((i) => i.variacao.produto.nome).join(', ')} · {formatCurrency(p.total)}
                </option>
              ))}
            </select>
          </Field>
        </fieldset>
      )}

      <fieldset className="client-form__step" disabled={!tipo}>
        <legend>
          <span className="step-number">{tipo?.exigeVenda ? 3 : 2}</span> Descreva sua solicitação
        </legend>
        <Field label="Descrição" hint="Inclua tamanho, cor ou qualquer detalhe que ajude nossa equipe.">
          <textarea className="textarea" rows={5} value={descricao} onChange={(e) => setDescricao(e.target.value)} minLength={10} required placeholder="Ex.: Gostaria de trocar a camisa pelo tamanho P…" />
        </Field>
      </fieldset>

      <FormError error={error} />

      <div className="form-actions">
        <Link to="/cliente/solicitacoes" className="btn btn-secondary">
          Cancelar
        </Link>
        <button type="submit" className="btn btn-primary" disabled={saving || !tipo}>
          {saving ? 'Enviando…' : 'Enviar solicitação'}
        </button>
      </div>
    </form>
  )
}
