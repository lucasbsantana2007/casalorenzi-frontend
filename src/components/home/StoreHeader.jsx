import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useSession } from '../../hooks/useSession'
import { BrandMark } from '../BrandMark'

const NAV = [
  { to: '/colecao/masculino', label: 'Masculino' },
  { to: '/colecao/feminino', label: 'Feminino' },
  { to: '/lojas', label: 'Lojas' },
  { to: '/cliente/solicitacoes', label: 'Atendimento' },
]

// Cabeçalho da loja. `overlay`: texto claro sobre a foto do início.
export function StoreHeader({ overlay = false }) {
  const { usuario, isCliente, isEquipe } = useSession()
  const [menuAberto, setMenuAberto] = useState(false)
  const conta = isEquipe
    ? { to: '/dashboard', label: 'Painel' }
    : { to: isCliente ? '/cliente' : '/login', label: isCliente ? usuario.nome.split(' ')[0] : 'Conta' }
  const fechar = () => setMenuAberto(false)

  return (
    <header className={`store-header ${overlay ? 'store-header--overlay' : ''} ${menuAberto ? 'is-open' : ''}`}>
      <Link to="/" className="store-header__brand" aria-label="Casa Lorenzi — início" onClick={fechar}>
        <BrandMark size="sm" inverse={overlay && !menuAberto} />
      </Link>

      <nav className="store-header__nav" aria-label="Navegação principal">
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} onClick={fechar} className={({ isActive }) => (isActive ? 'is-active' : undefined)}>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="store-header__actions">
        {!isEquipe && (
          <Link to="/cliente/pedidos" className="store-header__secondary" onClick={fechar}>
            Pedidos
          </Link>
        )}
        <Link to={conta.to} onClick={fechar}>
          {conta.label}
        </Link>
        <button type="button" className="store-header__menu" onClick={() => setMenuAberto((v) => !v)} aria-expanded={menuAberto} aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}>
          {menuAberto ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
    </header>
  )
}
