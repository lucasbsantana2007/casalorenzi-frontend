import { Menu, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useSacola } from '../../hooks/useSacola'
import { useSession } from '../../hooks/useSession'
import { BrandMark } from '../BrandMark'

const NAV = [
  { to: '/colecao/masculino', label: 'Masculino' },
  { to: '/colecao/feminino', label: 'Feminino' },
  { to: '/lojas', label: 'Lojas' },
  { to: '/meus-pedidos', label: 'Atendimento' },
]

// Fotos de abertura do início: enquanto estão sob o cabeçalho, ele fica transparente
const HERO = '.split-hero'

// Cabeçalho da loja, fixo no topo em todas as páginas.
// `overlay` (início): transparente com texto claro sobre as fotos; ao rolar para o fundo branco, vira branco com texto escuro.
export function StoreHeader({ overlay = false }) {
  const { isEquipe } = useSession()
  const { quantidadeTotal, abrir: abrirSacola } = useSacola()
  const [menuAberto, setMenuAberto] = useState(false)
  const [sobreFoto, setSobreFoto] = useState(overlay)
  const fechar = () => setMenuAberto(false)
  const ref = useRef(null)

  // Publica a altura real do cabeçalho em --store-header-h (foto do produto e resumo do checkout ficam logo abaixo dele)
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const publicar = () => document.documentElement.style.setProperty('--store-header-h', `${el.offsetHeight}px`)
    publicar()
    const observador = new ResizeObserver(publicar)
    observador.observe(el)
    return () => observador.disconnect()
  }, [])

  useEffect(() => {
    if (!overlay) return undefined
    // Leitura barata (uma medida); o React só re-renderiza quando o valor muda
    const medir = () => {
      const hero = document.querySelector(HERO)
      const fimDaFoto = hero ? hero.getBoundingClientRect().bottom : window.innerHeight - window.scrollY
      setSobreFoto(fimDaFoto > 80)
    }
    medir()
    window.addEventListener('scroll', medir, { passive: true })
    window.addEventListener('resize', medir)
    return () => {
      window.removeEventListener('scroll', medir)
      window.removeEventListener('resize', medir)
    }
  }, [overlay])

  const transparente = overlay && sobreFoto && !menuAberto

  return (
    <header ref={ref} className={`store-header ${overlay ? 'store-header--overlay' : ''} ${transparente ? 'is-transparent' : ''} ${menuAberto ? 'is-open' : ''}`}>
      <Link to="/" className="store-header__brand" aria-label="Casa Lorenzi — início" onClick={fechar}>
        <BrandMark size="sm" inverse={transparente} />
      </Link>

      <nav className="store-header__nav" aria-label="Navegação principal">
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} onClick={fechar} className={({ isActive }) => (isActive ? 'is-active' : undefined)}>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="store-header__actions">
        {/* Clientes não têm login; só a equipe logada vê o atalho do painel */}
        {isEquipe && (
          <Link to="/dashboard" onClick={fechar}>
            Painel
          </Link>
        )}
        <button
          type="button"
          className="store-header__bag"
          onClick={() => {
            fechar()
            abrirSacola()
          }}
          aria-label={`Abrir sacola, ${quantidadeTotal} ${quantidadeTotal === 1 ? 'item' : 'itens'}`}
        >
          Sacola ({quantidadeTotal})
        </button>
        <button type="button" className="store-header__menu" onClick={() => setMenuAberto((v) => !v)} aria-expanded={menuAberto} aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}>
          {menuAberto ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
    </header>
  )
}
