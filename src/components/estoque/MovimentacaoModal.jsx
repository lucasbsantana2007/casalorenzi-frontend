import { useState } from 'react'
import { useSession } from '../../hooks/useSession'
import { estoqueService } from '../../services/estoqueService'
import { formatNumber } from '../../utils/format'
import { Field } from '../ui/Field'
import { FormError } from '../ui/FormError'
import { Modal } from '../ui/Modal'

// Tipos que podem ser registrados manualmente. Transferências são geradas pelo fluxo próprio.
const TIPOS = {
  ENTRADA: { label: 'Entrada de mercadoria', sinal: 1, origem: 'Ex.: Recebimento do CD · NF 48213' },
  VENDA: { label: 'Venda / baixa', sinal: -1, origem: 'Ex.: Venda PDV · cupom 102938' },
  DEVOLUCAO: { label: 'Devolução de cliente', sinal: 1, origem: 'Ex.: Troca de tamanho · pedido CL-104876' },
  AJUSTE: { label: 'Ajuste de inventário', sinal: 0, origem: 'Ex.: Inventário rotativo' },
}

export function MovimentacaoModal({ item, open, onClose, onSaved }) {
  return (
    <Modal open={open} onClose={onClose} title="Registrar movimentação" description={item ? `${item.produto.nome} · ${item.variacao.sku} · ${item.loja.nome}` : ''}>
      {item && <MovimentacaoForm key={item.id} item={item} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  )
}

function MovimentacaoForm({ item, onClose, onSaved }) {
  const { usuario } = useSession()
  const [tipo, setTipo] = useState('ENTRADA')
  const [valor, setValor] = useState('')
  const [origem, setOrigem] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const numero = Number.parseInt(valor, 10)
  // Ajuste: o usuário informa a contagem física e o sistema calcula a diferença
  const delta = Number.isNaN(numero) ? 0 : TIPOS[tipo].sinal === 0 ? numero - item.quantidade : numero * TIPOS[tipo].sinal
  const saldoFinal = item.quantidade + delta

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    if (Number.isNaN(numero) || numero < 0 || (tipo !== 'AJUSTE' && numero === 0)) return setError(new Error('Informe uma quantidade válida.'))
    if (delta === 0) return setError(new Error('A contagem informada é igual ao saldo atual.'))
    if (saldoFinal < 0) return setError(new Error(`Saldo insuficiente: há ${item.quantidade} unidade(s) disponível(is).`))

    setSaving(true)
    try {
      await estoqueService.registrarMovimentacao({
        estoqueId: item.id,
        tipo,
        quantidade: delta,
        origem: origem.trim() || TIPOS[tipo].label,
        usuarioId: usuario.id,
      })
      onSaved()
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
        <Field label="Tipo de movimentação">
          <select className="select" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {Object.entries(TIPOS).map(([value, { label }]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label={tipo === 'AJUSTE' ? 'Contagem física' : 'Quantidade'}>
          <input className="input" type="number" min="0" step="1" inputMode="numeric" value={valor} onChange={(e) => setValor(e.target.value)} required />
        </Field>
        <Field label="Origem / referência" className="span-2">
          <input className="input" value={origem} onChange={(e) => setOrigem(e.target.value)} placeholder={TIPOS[tipo].origem} />
        </Field>
      </div>

      <div className="balance-preview">
        <span>
          Saldo atual <strong>{formatNumber(item.quantidade)}</strong>
        </span>
        <span aria-hidden="true">→</span>
        <span>
          Após registro <strong className={saldoFinal < 0 ? 'text-danger' : undefined}>{formatNumber(saldoFinal)}</strong>
        </span>
      </div>

      <FormError error={error} />

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Registrando…' : 'Registrar'}
        </button>
      </div>
    </form>
  )
}
