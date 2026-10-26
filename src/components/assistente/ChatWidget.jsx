import { MessageCircle } from 'lucide-react'
import { useReducedMotion } from 'motion/react'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAssistente } from '../../hooks/useAssistente'
import { useMarca } from '../../hooks/useMarca'
import { FlipButton } from '../ui/FlipButton'

const PainelChat = lazy(() => import('./PainelChat').then((m) => ({ default: m.PainelChat })))

// Tempo para o giro do botão aparecer antes de a janela de conversa abrir no lugar dele
const ESPERA_GIRO_MS = 320

// Assistente do site: botão flutuante e janela de conversa. Some no checkout (a compra segue sem distração).
// Respostas com dados reais do catálogo, do estoque e da conta; a compra continua sendo pela sacola.
export function ChatWidget({ marca: marcaFixa }) {
  const { pathname } = useLocation()
  const marcaDaPagina = useMarca()
  const marca = marcaFixa ?? marcaDaPagina.id
  const [aberto, setAberto] = useState(false)
  const assistente = useAssistente(marca === 'GRUPO' ? null : marca)
  const reduzir = useReducedMotion()
  const espera = useRef(null)

  useEffect(() => () => clearTimeout(espera.current), [])

  if (pathname.startsWith('/checkout')) return null

  const abrir = () => {
    if (espera.current) return
    espera.current = setTimeout(
      () => {
        espera.current = null
        setAberto(true)
        assistente.abrirPainel()
      },
      reduzir ? 0 : ESPERA_GIRO_MS,
    )
  }

  if (aberto) {
    return (
      <Suspense fallback={<div className="chat chat--abrindo" role="status">Abrindo o assistente…</div>}>
        <PainelChat assistente={assistente} onFechar={() => setAberto(false)} />
      </Suspense>
    )
  }
  return (
    <FlipButton
      className="chat-fab"
      textoAntes="Assistente"
      icone={MessageCircle}
      onClick={abrir}
      aria-label="Abrir o assistente virtual"
    />
  )
}
