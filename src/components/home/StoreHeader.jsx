import { Menu, ShoppingCart, User, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useSacola } from '../../hooks/useSacola'
import { useSession } from '../../hooks/useSession'
import { BrandMark } from '../BrandMark'

const NAV = [
  { to: '/colecao/masculino', label: 'Masculino' },
  { to: '/colecao/feminino', label: 'Feminino' },
  { to: '/lojas', label: 'Lojas' },
  { to: '/lorenzi', label: 'Lorenzi' },
]

// Boneco do cabeçalho: abre o login; com sessão, leva cada um para a sua área
function itemDaConta({ isCliente, isEquipe }) {
  if (isCliente) return { to: '/cliente', label: 'Minha conta' }
  if (isEquipe) return { to: '/dashboard', label: 'Painel' }
  return { to: '/login', label: 'Iniciar sessão' }
}

// Cabeçalho da loja: fica no topo da página e sai de vista ao rolar (não acompanha a rolagem).
// `overlay` (início): por cima das fotos, com texto claro.
export function StoreHeader({ overlay = false }) {
  const sessao = useSession()
  const conta = itemDaConta(sessao)
  const { quantidadeTotal, abrir: abrirSacola } = useSacola()
  const [menuAberto, setMenuAberto] = useState(false)
  const fechar = () => setMenuAberto(false)
  const transparente = overlay && !menuAberto

  return (
    <header className={`store-header ${overlay ? 'store-header--overlay' : ''} ${transparente ? 'is-transparent' : ''} ${menuAberto ? 'is-open' : ''}`}>
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
        <Link to={conta.to} className="store-header__icon" aria-label={conta.label} title={conta.label} onClick={fechar}>
          <User size={20} strokeWidth={1.5} aria-hidden="true" />
        </Link>
        <button
          type="button"
          className="store-header__bag"
          onClick={() => {
            fechar()
            abrirSacola()
          }}
          aria-label={`Abrir sacola, ${quantidadeTotal} ${quantidadeTotal === 1 ? 'item' : 'itens'}`}
        >
          <ShoppingCart size={20} strokeWidth={1.5} aria-hidden="true" />
          {quantidadeTotal > 0 && <span className="store-header__bag-count">{quantidadeTotal}</span>}
        </button>
        <button type="button" className="store-header__menu" onClick={() => setMenuAberto((v) => !v)} aria-expanded={menuAberto} aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}>
          {menuAberto ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
    </header>
  )
}
