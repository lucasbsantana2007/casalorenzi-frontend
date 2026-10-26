import { MessageCircle } from 'lucide-react'
import { lazy, Suspense, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAssistente } from '../../hooks/useAssistente'
import { useMarca } from '../../hooks/useMarca'

const PainelChat = lazy(() => import('./PainelChat').then((m) => ({ default: m.PainelChat })))

// Assistente do site: botão flutuante e janela de conversa. Some no checkout (a compra segue sem distração).
// Respostas com dados reais do catálogo, do estoque e da conta; a compra continua sendo pela sacola.
export function ChatWidget({ marca: marcaFixa }) {
  const { pathname } = useLocation()
  const marcaDaPagina = useMarca()
  const marca = marcaFixa ?? marcaDaPagina.id
  const [aberto, setAberto] = useState(false)
  const assistente = useAssistente(marca === 'GRUPO' ? null : marca)
  if (pathname.startsWith('/checkout')) return null

  const abrir = () => {
    setAberto(true)
    assistente.abrirPainel()
  }

  if (aberto) {
    return (
      <Suspense fallback={<div className="chat chat--abrindo" role="status">Abrindo o assistente…</div>}>
        <PainelChat assistente={assistente} onFechar={() => setAberto(false)} />
      </Suspense>
    )
  }
  return (
    <button type="button" className="chat-fab" onClick={abrir} aria-label="Abrir o assistente virtual">
      <MessageCircle size={18} strokeWidth={1.6} aria-hidden="true" />
      <span>Assistente</span>
    </button>
  )
}
