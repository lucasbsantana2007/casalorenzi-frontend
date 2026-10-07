import { ArrowLeft } from 'lucide-react'
import { MotionConfig } from 'motion/react'
import { Link } from 'react-router-dom'
import { BrandMark } from '../BrandMark'
import { LoginShowcase } from './LoginShowcase'

// Telas ligadas ao login (criar conta, nova senha): formulário à esquerda, frase à direita
export function LayoutAcesso({ titulo, children }) {
  return (
    <MotionConfig reducedMotion="user">
      <main className="login">
        <section className="login__panel">
          <div className="login__form-wrap">
            <Link to="/login" className="back-link">
              <ArrowLeft size={14} /> Iniciar sessão
            </Link>
            <h1 className="login__brand">
              <BrandMark />
              <span className="login__brand-area">{titulo}</span>
            </h1>
            {children}
          </div>
        </section>
        <LoginShowcase />
      </main>
    </MotionConfig>
  )
}
