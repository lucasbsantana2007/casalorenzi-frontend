import { useState } from 'react'
import { useAsync } from '../../hooks/useAsync'
import { useLojas } from '../../hooks/useCadastros'
import { useSession } from '../../hooks/useSession'
import { estoqueService } from '../../services/estoqueService'
import { produtosService } from '../../services/produtosService'
import { transferenciasService } from '../../services/transferenciasService'
import { Field } from '../ui/Field'
import { FormError } from '../ui/FormError'
import { Modal } from '../ui/Modal'

// initial (opcional): { produtoId, variacaoId, lojaOrigemId } — usado ao transferir a partir do estoque
export function TransferenciaModal({ open, onClose, onSaved, initial }) {
  return (
    <Modal open={open} onClose={onClose} title="Nova transferência" description="Solicite o envio de peças entre lojas. A baixa ocorre no despacho.">
      {open && <TransferenciaForm initial={initial} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  )
}

function TransferenciaForm({ initial = {}, onClose, onSaved }) {
  const { usuario } = useSession()
  const lojas = useLojas()
  const produtos = useAsync(() => produtosService.listar({ ativo: true }), []).data ?? []
  const [produtoId, setProdutoId] = useState(String(initial.produtoId ?? ''))
  const [variacaoId, setVariacaoId] = useState(String(initial.variacaoId ?? ''))
  const [lojaOrigemId, setLojaOrigemId] = useState(String(initial.lojaOrigemId ?? ''))
  const [lojaDestinoId, setLojaDestinoId] = useState('')
  const [quantidade, setQuantidade] = useState('1')
  const [observacao, setObservacao] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const disponibilidade = useAsync(() => (variacaoId ? estoqueService.listar({ variacaoId }) : Promise.resolve([])), [variacaoId]).data ?? []
  const saldoPorLoja = Object.fromEntries(disponibilidade.map((e) => [e.lojaId, e.quantidade]))
  const variacoes = produtos.find((p) => String(p.id) === produtoId)?.variacoes ?? []
  const disponivel = saldoPorLoja[lojaOrigemId] ?? 0

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await transferenciasService.criar({
        variacaoId: Number(variacaoId),
        lojaOrigemId: Number(lojaOrigemId),
        lojaDestinoId: Number(lojaDestinoId),
        quantidade: Number(quantidade),
        observacao: observacao.trim(),
        usuarioId: usuario.id,
      })
      onSaved?.()
      onClose()
    } catch (err) {
      setError(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="stack-sm" onSubmit={handleSubmit}>
      <div className="form-grid">
        <Field label="Produto" className="span-2">
          <select
            className="select"
            value={produtoId}
            onChange={(e) => {
              setProdutoId(e.target.value)
              setVariacaoId('')
            }}
            required
          >
            <option value="">Selecione…</option>
            {produtos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Variação (SKU)" className="span-2">
          <select className="select" value={variacaoId} onChange={(e) => setVariacaoId(e.target.value)} required disabled={!produtoId}>
            <option value="">Selecione…</option>
            {variacoes.map((v) => (
              <option key={v.id} value={v.id}>
                {v.sku} · {v.cor} · {v.tamanho}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Loja de origem">
          <select className="select" value={lojaOrigemId} onChange={(e) => setLojaOrigemId(e.target.value)} required>
            <option value="">Selecione…</option>
            {lojas.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nome}
                {variacaoId ? ` — ${saldoPorLoja[l.id] ?? 0} un.` : ''}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Loja de destino">
          <select className="select" value={lojaDestinoId} onChange={(e) => setLojaDestinoId(e.target.value)} required>
            <option value="">Selecione…</option>
            {lojas
              .filter((l) => String(l.id) !== lojaOrigemId)
              .map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nome}
                </option>
              ))}
          </select>
        </Field>
        <Field label="Quantidade" hint={lojaOrigemId && variacaoId ? `${disponivel} disponível(is) na origem` : undefined}>
          <input className="input" type="number" min="1" max={disponivel || undefined} step="1" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} required />
        </Field>
        <Field label="Observação">
          <input className="input" value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Ex.: cliente aguardando" />
        </Field>
      </div>

      <FormError error={error} />

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Enviando…' : 'Solicitar transferência'}
        </button>
      </div>
    </form>
  )
}
