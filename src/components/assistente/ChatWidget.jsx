import { MessageCircle } from 'lucide-react'
import { animate, AnimatePresence, motion, usePresence, useReducedMotion } from 'motion/react'
import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAssistente } from '../../hooks/useAssistente'
import { useMarca } from '../../hooks/useMarca'
import { FlipButton } from '../ui/FlipButton'

const carregarPainel = () => import('./PainelChat')
const PainelChat = lazy(() => carregarPainel().then((m) => ({ default: m.PainelChat })))

// Curva suave de desaceleração para abrir; ao fechar, uma um pouco mais curta e simétrica
const ABRIR = { duration: 0.55, ease: [0.32, 0.72, 0, 1] }
const FECHAR = { duration: 0.38, ease: [0.4, 0, 0.2, 1] }

// Assistente do site: botão flutuante e janela de conversa. Some no checkout (a compra segue sem distração).
// Respostas com dados reais do catálogo, do estoque e da conta; a compra continua sendo pela sacola.
// Ao abrir, a pílula do botão cresce até virar a janela; ao fechar, a janela volta para o botão.
export function ChatWidget({ marca: marcaFixa }) {
  const { pathname } = useLocation()
  const marcaDaPagina = useMarca()
  const marca = marcaFixa ?? marcaDaPagina.id
  const [aberto, setAberto] = useState(false)
  const [origem, setOrigem] = useState(null)
  const lugarRef = useRef(null)
  const assistente = useAssistente(marca === 'GRUPO' ? null : marca)
  const fechar = useCallback(() => setAberto(false), [])

  // Baixa a janela com folga, para a abertura não esperar a rede
  useEffect(() => {
    const espera = setTimeout(carregarPainel, 1500)
    return () => clearTimeout(espera)
  }, [])

  if (pathname.startsWith('/checkout')) return null

  const abrir = () => {
    setOrigem(lugarRef.current?.getBoundingClientRect() ?? null)
    setAberto(true)
    assistente.abrirPainel()
  }

  return (
    <>
      <AnimatePresence initial={false}>
        {!aberto && (
          <motion.div
            key="botao"
            ref={lugarRef}
            className="chat-fab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.2, delay: 0.22 } }}
            exit={{ opacity: 0, transition: { duration: 0.16 } }}
          >
            <FlipButton
              className="chat-fab__botao"
              icone={MessageCircle}
              title="Fale com a Lúcia"
              virarAoClicar={false}
              onClick={abrir}
              onPointerEnter={carregarPainel}
              onFocus={carregarPainel}
              aria-label="Abrir a Lúcia, assistente virtual"
            />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {aberto && (
          <Janela key="janela" origem={origem}>
            <Suspense fallback={<div className="chat chat--abrindo" role="status">Abrindo a Lúcia…</div>}>
              <PainelChat assistente={assistente} onFechar={fechar} />
            </Suspense>
          </Janela>
        )}
      </AnimatePresence>
    </>
  )
}

const CELULAR = '(max-width: 640px)'

// No celular a janela ocupa a tela inteira. Quando o teclado abre, o Safari do iPhone não encolhe a página:
// ele a desloca, e a janela fixa ficava desencaixada, com o site aparecendo por trás. Aqui a janela segue a área
// que de fato está visível (visualViewport) e a página de trás fica travada enquanto o chat está aberto.
function useTelaVisivelNoCelular(ref) {
  useLayoutEffect(() => {
    const vv = window.visualViewport
    const midia = window.matchMedia(CELULAR)
    const raiz = document.documentElement
    const ajustar = () => {
      const el = ref.current
      if (!el) return
      const celular = midia.matches
      raiz.classList.toggle('chat-aberto-celular', celular)
      if (!celular || !vv) {
        el.style.removeProperty('--tela-topo')
        el.style.removeProperty('--tela-altura')
        return
      }
      el.style.setProperty('--tela-topo', `${vv.offsetTop}px`)
      el.style.setProperty('--tela-altura', `${vv.height}px`)
    }
    ajustar()
    vv?.addEventListener('resize', ajustar)
    vv?.addEventListener('scroll', ajustar)
    midia.addEventListener('change', ajustar)
    return () => {
      vv?.removeEventListener('resize', ajustar)
      vv?.removeEventListener('scroll', ajustar)
      midia.removeEventListener('change', ajustar)
      raiz.classList.remove('chat-aberto-celular')
    }
  }, [ref])
}

// Recorta a janela no formato da pílula do botão e anima o recorte até a janela inteira (e o inverso ao
// fechar). O conteúdo não é esticado: só a área visível cresce.
function Janela({ origem, children }) {
  const recorteRef = useRef(null)
  const [presente, remover] = usePresence()
  const reduzir = useReducedMotion()

  const formas = useCallback(() => {
    const el = recorteRef.current
    if (!el || !origem) return null
    const janela = el.getBoundingClientRect()
    const raio = getComputedStyle(el).borderTopLeftRadius || '0px'
    const d = (valor) => `${Math.max(0, valor)}px`
    return {
      cheia: `inset(0px 0px 0px 0px round ${raio})`,
      pilula: `inset(${d(origem.top - janela.top)} ${d(janela.right - origem.right)} ${d(janela.bottom - origem.bottom)} ${d(origem.left - janela.left)} round ${origem.height / 2}px)`,
    }
  }, [origem])

  useLayoutEffect(() => {
    const el = recorteRef.current
    const f = formas()
    const animacao =
      reduzir || !f ? animate(el, { opacity: [0, 1] }, { duration: 0.2 }) : animate(el, { clipPath: [f.pilula, f.cheia] }, ABRIR)
    return () => animacao.stop()
  }, [formas, reduzir])

  useEffect(() => {
    if (presente) return
    const el = recorteRef.current
    const f = formas()
    const animacao =
      reduzir || !f ? animate(el, { opacity: 0 }, { duration: 0.15 }) : animate(el, { clipPath: [f.cheia, f.pilula] }, FECHAR)
    animacao.then(() => remover?.())
    // Reaberto no meio do fechamento: interrompe o fechamento e deixa a abertura assumir
    return () => animacao.stop()
  }, [presente, formas, reduzir, remover])

  const molduraRef = useRef(null)
  useTelaVisivelNoCelular(molduraRef)

  return (
    <div ref={molduraRef} className="chat-moldura">
      <div ref={recorteRef} className="chat-recorte">
        {children}
      </div>
    </div>
  )
}
