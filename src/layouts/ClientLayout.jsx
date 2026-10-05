import { LogOut } from 'lucide-react'
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BrandMark } from '../components/BrandMark'
import { useSession } from '../hooks/useSession'

const LINKS = [
  { to: '/cliente', label: 'Início', end: true },
  { to: '/cliente/solicitacoes', label: 'Minhas solicitações' },
  { to: '/cliente/pedidos', label: 'Meus pedidos' },
]

// Área do cliente: experiência separada do painel interno, com a mesma identidade.
export function ClientLayout() {
  const { usuario, isCliente } = useSession()
  const location = useLocation()
  const navigate = useNavigate()

  if (!isCliente) return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />

  return (
    <div className="client-shell">
      <header className="client-header">
        <div className="client-container client-header__inner">
          <Link to="/cliente" className="client-header__brand">
            <BrandMark size="sm" />
          </Link>
          <nav className="client-nav" aria-label="Área do cliente">
            {LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => `client-nav__link ${isActive ? 'is-active' : ''}`}>
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="client-header__user">
            <span>{usuario.nome}</span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/', { state: { sair: true } })}
            >
              <LogOut size={14} /> Sair
            </button>
          </div>
        </div>
      </header>

      <main className="client-container client-content">
        <Outlet />
      </main>

      <footer className="client-footer">
        <div className="client-container client-footer__inner">
          <span>Casa Lorenzi · Oscar Freire · Iguatemi · Leblon · Pátio Batel</span>
          <Link to="/">Página inicial</Link>
        </div>
      </footer>
    </div>
  )
}
