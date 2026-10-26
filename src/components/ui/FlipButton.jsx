import { motion, useReducedMotion } from 'motion/react'
import { useLayoutEffect, useRef, useState } from 'react'

// Botão que gira no eixo X e troca de cor ao ser clicado. Adaptado do FlipButton (shadcn) para o projeto:
// JavaScript, motion/react (o mesmo pacote das outras animações) e CSS próprio, sem Tailwind.
// textoAntes: o que aparece antes do clique; textoDepois: depois. cores aceita valores CSS, inclusive
// variáveis (var(--navy-950)), resolvidas no próprio botão para seguir a paleta da marca aberta.
// virarAoClicar={false}: o clique só dispara onClick (quando outra animação assume, como a do chat).
const CORES_PADRAO = {
  antes: { fundo: '#ffffff', texto: 'var(--navy-950)' },
  depois: { fundo: 'var(--navy-950)', texto: '#ffffff' },
}

function resolver(elemento, valor) {
  const variavel = /^var\((--[\w-]+)\)$/.exec(valor)
  if (!variavel || !elemento) return valor
  return getComputedStyle(elemento).getPropertyValue(variavel[1]).trim() || valor
}

export function FlipButton({
  textoAntes,
  textoDepois = textoAntes,
  icone: Icone,
  cores = CORES_PADRAO,
  virarAoClicar = true,
  onClick,
  className = '',
  style,
  ...props
}) {
  const [virado, setVirado] = useState(false)
  const [paleta, setPaleta] = useState(null)
  const botaoRef = useRef(null)
  const reduzir = useReducedMotion()

  // As cores animadas precisam ser valores concretos (o motion não interpola var())
  useLayoutEffect(() => {
    const el = botaoRef.current
    setPaleta({
      antes: { backgroundColor: resolver(el, cores.antes.fundo), color: resolver(el, cores.antes.texto) },
      depois: { backgroundColor: resolver(el, cores.depois.fundo), color: resolver(el, cores.depois.texto) },
    })
  }, [cores])

  const transicao = reduzir ? { duration: 0 } : { duration: 0.6, type: 'spring' }
  const variantes = paleta && {
    antes: { rotateX: 0, ...paleta.antes },
    depois: { rotateX: 180, ...paleta.depois },
  }

  return (
    <motion.button
      ref={botaoRef}
      type="button"
      className={`flip-button ${className}`}
      style={{ transformPerspective: 800, ...style }}
      onClick={(evento) => {
        if (virarAoClicar) setVirado((v) => !v)
        onClick?.(evento, virarAoClicar ? !virado : virado)
      }}
      variants={variantes ?? undefined}
      initial={false}
      animate={variantes ? (virado ? 'depois' : 'antes') : undefined}
      transition={transicao}
      whileTap={reduzir ? undefined : { scale: 0.95 }}
      whileHover={reduzir ? undefined : { scale: 1.05 }}
      {...props}
    >
      <motion.span className="flip-button__conteudo" animate={{ rotateX: virado ? 180 : 0 }} transition={transicao}>
        {Icone && <Icone size={18} strokeWidth={1.6} aria-hidden="true" />}
        <span>{virado ? textoDepois : textoAntes}</span>
      </motion.span>
    </motion.button>
  )
}
