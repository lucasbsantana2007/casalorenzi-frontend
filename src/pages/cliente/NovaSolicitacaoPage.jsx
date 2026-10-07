import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { SeletorAssunto } from '../../components/atendimento/SeletorAssunto'
import { AnexoFoto } from '../../components/loja/AnexoFoto'
import { SeletorPedido } from '../../components/loja/SeletorPedido'
import { AsyncContent } from '../../components/ui/AsyncContent'
import { Field } from '../../components/ui/Field'
import { FormError } from '../../components/ui/FormError'
import { useAsync } from '../../hooks/useAsync'
import { useSession } from '../../hooks/useSession'
import { cadastrosService } from '../../services/cadastrosService'
import { clienteService } from '../../services/clienteService'

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
  // ?tipo=<id> pré-seleciona o assunto (links de atendimento da página inicial)
  const [tipoId, setTipoId] = useState(() => tipos.find((t) => t.id === Number(params.get('tipo')))?.id ?? null)
  // ?pedido=<id> pré-seleciona o pedido; o seletor trabalha com o número do pedido
  const [numeroEscolhido, setNumeroEscolhido] = useState('')
  const pedidoInicial = pedidos.find((p) => p.id === Number(params.get('pedido')))?.numero ?? ''
  const numero = numeroEscolhido || pedidoInicial
  const pedidoId = pedidos.find((p) => p.numero === numero)?.id ?? null
  const [descricao, setDescricao] = useState('')
  const [foto, setFoto] = useState(null) // já reduzida no navegador: { nome, tipo, conteudoBase64, url, tamanho }
  const [preparandoFoto, setPreparandoFoto] = useState(false)
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
        pedidoId: tipo?.exigeVenda ? pedidoId : null,
        descricao,
        anexo: foto && { nome: foto.nome, tipo: foto.tipo, conteudoBase64: foto.conteudoBase64 },
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
        <SeletorAssunto tipos={tipos} value={tipoId} onChange={setTipoId} />
      </fieldset>

      {tipo?.exigeVenda && (
        <fieldset className="client-form__step">
          <legend>
            <span className="step-number">2</span> Sobre qual pedido?
          </legend>
          {pedidos.length ? (
            <SeletorPedido pedidos={pedidos} value={numero} onChange={setNumeroEscolhido} />
          ) : (
            <p className="muted">Você ainda não tem pedidos. Este assunto precisa estar ligado a uma compra.</p>
          )}
        </fieldset>
      )}

      <fieldset className="client-form__step" disabled={!tipo}>
        <legend>
          <span className="step-number">{tipo?.exigeVenda ? 3 : 2}</span> Descreva sua solicitação
        </legend>
        <Field label="Descrição" hint="Inclua tamanho, cor ou qualquer detalhe que ajude nossa equipe.">
          <textarea className="textarea" rows={5} value={descricao} onChange={(e) => setDescricao(e.target.value)} minLength={10} required placeholder="Ex.: Gostaria de trocar a camisa pelo tamanho P…" />
        </Field>
        <AnexoFoto value={foto} onChange={setFoto} onProcessando={setPreparandoFoto} />
      </fieldset>

      <FormError error={error} />

      <div className="form-actions">
        <Link to="/cliente/solicitacoes" className="btn btn-secondary">
          Cancelar
        </Link>
        <button type="submit" className="btn btn-primary" disabled={saving || preparandoFoto || !tipo || (tipo.exigeVenda && !pedidoId)}>
          {saving ? 'Enviando…' : 'Enviar solicitação'}
        </button>
      </div>
    </form>
  )
}
