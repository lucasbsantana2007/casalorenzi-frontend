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

const CONTEUDO = {
  cliente: {
    eyebrow: 'Casa Lorenzi · Sua conta',
    titulo: 'Seus pedidos e atendimentos, acompanhados de perto.',
    texto: 'Trocas, devoluções, ajustes de costura e rastreio de entregas.',
    url: 'casalorenzi.com.br/cliente',
    imagem: previewCliente,
    alt: 'Prévia da área do cliente',
  },
  equipe: {
    eyebrow: 'Casa Lorenzi · Acesso da equipe',
    titulo: 'Estoque, transferências e atendimento das quatro lojas, em um só lugar.',
    texto: 'Oscar Freire · Iguatemi São Paulo · Leblon · Pátio Batel',
    url: 'casalorenzi.com.br/dashboard',
    imagem: previewEquipe,
    alt: 'Prévia do painel da equipe',
  },
}

// Painel de apresentação do login, com conteúdo da área (cliente ou equipe).
export function LoginShowcase({ area }) {
  const c = CONTEUDO[area]
  return (
    <div className="login-showcase">
      <FlutedBackdrop />

      <div className="login-showcase__content">
        <motion.p className="login-showcase__eyebrow" {...reveal(0, 12)}>
          {c.eyebrow}
        </motion.p>
        <motion.h2 className="login-showcase__title" {...reveal(0.12, 18, 8)}>
          {c.titulo}
        </motion.h2>
        <motion.p className="login-showcase__text" {...reveal(0.2, 18, 8)}>
          {c.texto}
        </motion.p>
      </div>

      <div className="login-showcase__mockup">
        <motion.div className="login-showcase__window" {...reveal(0.3, 72, 10)} transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}>
          <div className="login-showcase__bar" aria-hidden="true">
            <span />
            <span />
            <span />
            <small>{c.url}</small>
          </div>
          <img src={c.imagem} alt={c.alt} />
        </motion.div>
      </div>
    </div>
  )
}
