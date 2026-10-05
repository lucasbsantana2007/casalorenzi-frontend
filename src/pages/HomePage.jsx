import { ArrowRight, MapPin } from 'lucide-react'
import { motion, MotionConfig } from 'motion/react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import feminino from '../assets/colecao/feminino.jpg'
import hero from '../assets/colecao/hero.jpg'
import inverno from '../assets/colecao/inverno.jpg'
import masculino from '../assets/colecao/masculino.jpg'
import verao from '../assets/colecao/verao.jpg'
import { CollectionSection } from '../components/home/CollectionSection'
import { ServiceSection } from '../components/home/ServiceSection'
import { StoreFooter } from '../components/home/StoreFooter'
import { StoreHeader } from '../components/home/StoreHeader'
import { useLojas } from '../hooks/useCadastros'
import { useSession } from '../hooks/useSession'

const EASE = [0.22, 1, 0.36, 1]
const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 16, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: 0.8, delay, ease: EASE },
})

const ENTRADAS = [
  { filtro: 'Masculino', imagem: masculino, texto: 'Alfaiataria e camisaria' },
  { filtro: 'Feminino', imagem: feminino, texto: 'Seda, tricô e casacos' },
  { filtro: 'Inverno', imagem: inverno, texto: 'Lã fria, cashmere e trench' },
  { filtro: 'Verão', imagem: verao, texto: 'Linho, piquet e leveza' },
]

const rolarPara = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

// Página inicial pública, voltada ao cliente: coleção, atendimento e lojas.
// O acesso da equipe fica no rodapé.
export function HomePage() {
  const { logout } = useSession()
  const location = useLocation()
  const navigate = useNavigate()
  const lojas = useLojas()
  const [filtro, setFiltro] = useState('Todos')
  const sair = location.state?.sair

  // "Sair" navega para cá com { sair: true }; a sessão é encerrada só aqui, depois que
  // as áreas protegidas já foram desmontadas (evita o redirecionamento para o login).
  useEffect(() => {
    if (!sair) return
    logout()
    navigate('/', { replace: true, state: null })
  }, [sair, logout, navigate])

  function filtrar(valor, rolar = true) {
    setFiltro(valor)
    if (rolar) rolarPara('colecao')
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="store">
        <StoreHeader onFiltrar={filtrar} />

        <section className="store-hero">
          <div className="store-hero__media" aria-hidden="true">
            <img src={hero} alt="" />
          </div>
          <div className="store-container store-hero__content">
            <motion.p className="store-eyebrow" {...reveal(0)}>
              Outono-Inverno 2026
            </motion.p>
            <motion.h1 className="store-hero__title" {...reveal(0.1)}>
              Herança
              <br />
              contemporânea.
            </motion.h1>
            <motion.p className="store-hero__text" {...reveal(0.2)}>
              Alfaiataria, linho e tricô para quem prefere durar a acompanhar. Escolha receber em casa ou retirar hoje na loja mais perto de você.
            </motion.p>
            <motion.div className="store-hero__actions" {...reveal(0.3)}>
              <button type="button" className="store-btn store-btn--primary" onClick={() => filtrar('Todos')}>
                Ver a coleção
              </button>
              <button type="button" className="store-btn store-btn--outline" onClick={() => rolarPara('lojas')}>
                Retirar hoje em uma loja
              </button>
            </motion.div>
          </div>
        </section>

        <section className="store-container store-section">
          <div className="store-section__heading">
            <div>
              <p className="store-eyebrow">Navegue por</p>
              <h2 className="store-title">Duas entradas por gênero, duas por estação</h2>
            </div>
            <button type="button" className="store-link" onClick={() => filtrar('Todos')}>
              Ver tudo <ArrowRight size={15} />
            </button>
          </div>
          <ul className="entry-grid">
            {ENTRADAS.map((entrada) => (
              <li key={entrada.filtro}>
                <button type="button" className="entry-card" onClick={() => filtrar(entrada.filtro)}>
                  <img src={entrada.imagem} alt="" loading="lazy" />
                  <span className="entry-card__label">
                    <strong>{entrada.filtro}</strong>
                    <span>{entrada.texto}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <CollectionSection filtro={filtro} onFiltrar={filtrar} />

        <ServiceSection />

        <section id="lojas" className="store-container store-section">
          <div className="store-section__heading">
            <div>
              <p className="store-eyebrow">Retire hoje</p>
              <h2 className="store-title">Nossas lojas</h2>
            </div>
          </div>
          <ul className="store-grid">
            {lojas.map((loja) => (
              <li key={loja.id} className="store-card">
                <MapPin size={18} strokeWidth={1.5} aria-hidden="true" />
                <strong>{loja.nome}</strong>
                <span>
                  {loja.cidade} · {loja.uf}
                </span>
                <span className="store-card__note">Retirada no mesmo dia para peças disponíveis</span>
              </li>
            ))}
          </ul>
        </section>

        <StoreFooter />
      </div>
    </MotionConfig>
  )
}
