import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BrandMark } from '../BrandMark'
import agua1000 from '../../assets/login/agua-1000.jpg'
import agua1800 from '../../assets/login/agua-1800.jpg'

const TELA_GRANDE = '(min-width: 1024px)'

// A foto só existe em tela grande; no celular ela nem é baixada
function useTelaGrande() {
  const [grande, setGrande] = useState(() => window.matchMedia(TELA_GRANDE).matches)
  useEffect(() => {
    const mq = window.matchMedia(TELA_GRANDE)
    const sincronizar = () => setGrande(mq.matches)
    mq.addEventListener('change', sincronizar)
    return () => mq.removeEventListener('change', sincronizar)
  }, [])
  return grande
}

// Telas de acesso (entrar, criar conta, nova senha): foto de água à esquerda e
// formulário no branco à direita. No celular só o lado branco.
export function LayoutAcesso({ titulo, subtitulo, voltar = { to: '/login', label: 'Iniciar sessão' }, children }) {
  const telaGrande = useTelaGrande()
  return (
    <main className="acesso">
      <div className="acesso__cor">
        {telaGrande && (
          <img className="acesso__foto" src={agua1000} srcSet={`${agua1000} 1000w, ${agua1800} 1800w`} sizes="50vw" alt="" decoding="async" />
        )}
      </div>
      <section className="acesso__lado">
        <Link to={voltar.to} className="acesso__voltar">
          <ArrowLeft size={14} aria-hidden="true" /> {voltar.label}
        </Link>
        <div className="acesso__conteudo">
          <Link to="/" className="acesso__marca" aria-label="Casa Lorenzi — início">
            <BrandMark size="sm" />
          </Link>
          <header className="acesso__cabecalho">
            <h1>{titulo}</h1>
            {subtitulo && <p>{subtitulo}</p>}
          </header>
          {children}
        </div>
      </section>
    </main>
  )
}
