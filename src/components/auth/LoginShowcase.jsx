import { motion } from 'motion/react'

const EASE = [0.22, 1, 0.36, 1]

const reveal = (delay = 0, y = 16, blur = 6) => ({
  initial: { opacity: 0, y, filter: `blur(${blur}px)` },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: 0.8, delay, ease: EASE },
})

// Painel azul-marinho do login: só uma frase de impacto
export function LoginShowcase() {
  return (
    <div className="login-showcase">
      <figure className="login-showcase__quote">
        <motion.blockquote {...reveal(0, 18, 8)}>
          <p>
            <span className="login-showcase__aspas">“</span>A melhor maneira de iniciar é parar de falar e começar a fazer!
            <span className="login-showcase__aspas">”</span>
          </p>
        </motion.blockquote>
        <motion.figcaption {...reveal(0.2, 12)}>
          <strong>Walt Disney</strong>, desenhista e empresário americano
        </motion.figcaption>
      </figure>
    </div>
  )
}
