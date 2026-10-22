import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { inicioDaMarca, loginDaMarca } from '../../data/marcas'
import { useMarca } from '../../hooks/useMarca'
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

// Painel esquerdo do acesso da Vulto: preto, com a manchete e o traço laranja da vitrine
function PainelVulto() {
  return (
    <div className="acesso__vulto">
      <p className="acesso__vulto-selo">Vulto+ · site · app · lojas</p>
      <p className="acesso__vulto-titulo">
        Uma conta.
        <br />
        Duas marcas.
      </p>
      <p className="acesso__vulto-texto">A mesma conta vale na Vulto e na Casa Lorenzi, com os mesmos pontos Vulto+.</p>
    </div>
  )
}

// Telas de acesso (entrar, criar conta, nova senha): painel à esquerda e formulário no branco à
// direita. No celular só o lado branco. Casa Lorenzi (/login): foto de água e o monograma; Vulto
// (/vulto/login): painel preto e a identidade dela. A conta e o destino depois de entrar são os mesmos.
export function LayoutAcesso({ titulo, subtitulo, voltar, children }) {
  const telaGrande = useTelaGrande()
  const marca = useMarca()
  const vulto = marca.id === 'VULTO'
  const destinoVoltar = voltar ?? { to: loginDaMarca(marca), label: 'Iniciar sessão' }
  return (
    <main className={`acesso ${vulto ? 'acesso--vulto' : ''}`}>
      <div className="acesso__cor">
        {vulto && telaGrande && <PainelVulto />}
        {!vulto && telaGrande && (
          <img className="acesso__foto" src={agua1000} srcSet={`${agua1000} 1000w, ${agua1800} 1800w`} sizes="50vw" alt="" decoding="async" />
        )}
      </div>
      <section className="acesso__lado">
        <Link to={destinoVoltar.to} className="acesso__voltar">
          <ArrowLeft size={14} aria-hidden="true" /> {destinoVoltar.label}
        </Link>
        <div className="acesso__conteudo">
          <Link to={inicioDaMarca(marca)} className="acesso__marca" aria-label={`${marca.nome} — início`}>
            {vulto ? <img src={marca.logo} alt={marca.nome} className="acesso__logo" /> : <BrandMark size="sm" />}
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
