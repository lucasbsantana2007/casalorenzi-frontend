import { motion } from 'motion/react'
import previewCliente from '../../assets/login-preview-cliente.jpg'
import previewEquipe from '../../assets/login-preview-equipe.jpg'
import { FlutedBackdrop } from './FlutedBackdrop'

const EASE = [0.22, 1, 0.36, 1]

const reveal = (delay = 0, y = 16, blur = 6) => ({
  initial: { opacity: 0, y, filter: `blur(${blur}px)` },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: 0.8, delay, ease: EASE },
})

function Janela({ url, imagem, alt, className, delay }) {
  return (
    <div className={`login-showcase__mockup ${className}`}>
      <motion.div className="login-showcase__window" {...reveal(delay, 72, 10)} transition={{ duration: 1, delay, ease: [0.16, 1, 0.3, 1] }}>
        <div className="login-showcase__bar" aria-hidden="true">
          <span />
          <span />
          <span />
          <small>{url}</small>
        </div>
        <img src={imagem} alt={alt} />
      </motion.div>
    </div>
  )
}

// Painel de apresentação do login: um só acesso leva cada conta à sua área.
export function LoginShowcase() {
  return (
    <div className="login-showcase">
      <FlutedBackdrop />

      <div className="login-showcase__content">
        <motion.p className="login-showcase__eyebrow" {...reveal(0, 12)}>
          Casa Lorenzi · Acesso único
        </motion.p>
        <motion.h2 className="login-showcase__title" {...reveal(0.12, 18, 8)}>
          Uma conta, e cada um no seu lugar.
        </motion.h2>
        <motion.p className="login-showcase__text" {...reveal(0.2, 18, 8)}>
          Clientes acompanham pedidos e atendimentos. A equipe gerencia estoque, transferências e o atendimento das quatro lojas.
        </motion.p>
      </div>

      <Janela url="casalorenzi.com.br/dashboard" imagem={previewEquipe} alt="Prévia do painel da equipe" className="login-showcase__mockup--equipe" delay={0.3} />
      <Janela url="casalorenzi.com.br/cliente" imagem={previewCliente} alt="Prévia da área do cliente" className="login-showcase__mockup--cliente" delay={0.45} />
    </div>
  )
}
