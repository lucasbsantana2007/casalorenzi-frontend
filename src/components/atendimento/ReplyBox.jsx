import { Send } from 'lucide-react'
import { useState } from 'react'
import { FormError } from '../ui/FormError'

// Caixa de resposta. onSend(texto, opcoes) deve retornar uma Promise.
// `extraAction` permite uma segunda ação (ex.: "Responder e concluir").
export function ReplyBox({ onSend, placeholder = 'Escreva uma resposta…', extraAction, disabled }) {
  const [texto, setTexto] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)

  async function enviar(opcoes = {}) {
    if (!texto.trim()) return
    setSending(true)
    setError(null)
    try {
      await onSend(texto, opcoes)
      setTexto('')
    } catch (err) {
      setError(err)
    } finally {
      setSending(false)
    }
  }

  return (
    <form
      className="reply-box"
      onSubmit={(event) => {
        event.preventDefault()
        enviar()
      }}
    >
      <textarea
        className="textarea"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder={placeholder}
        aria-label="Mensagem"
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) enviar()
        }}
      />
      <FormError error={error} />
      <div className="reply-box__actions">
        <span className="subtle">Ctrl + Enter para enviar</span>
        {extraAction && (
          <button type="button" className="btn btn-secondary" disabled={sending || disabled || !texto.trim()} onClick={() => enviar(extraAction.opcoes)}>
            {extraAction.label}
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={sending || disabled || !texto.trim()}>
          <Send size={15} /> {sending ? 'Enviando…' : 'Enviar'}
        </button>
      </div>
    </form>
  )
}
