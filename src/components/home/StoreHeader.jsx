import { Menu, X } from 'lucide-react'
import { useState } from 'react'
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

// Cabeçalho da loja: fica no topo da página e sai de vista ao rolar (não acompanha a rolagem).
// `overlay` (início): por cima das fotos, com texto claro.
export function StoreHeader({ overlay = false }) {
  const { isEquipe } = useSession()
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
