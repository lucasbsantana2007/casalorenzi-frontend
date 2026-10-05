import { NavLink, Outlet, Link } from 'react-router-dom'
import { BrandMark } from '../components/BrandMark'
import { clienteService } from '../services/clienteService'
import { useAsync } from '../hooks/useAsync'
import { useSession } from '../hooks/useSession'

const LINKS = [
  { to: '/cliente', label: 'Início', end: true },
  { to: '/cliente/solicitacoes', label: 'Minhas solicitações' },
  { to: '/cliente/pedidos', label: 'Meus pedidos' },
]

// Portal do cliente: experiência separada do painel interno, com a mesma identidade.
export function ClientLayout() {
  const { clienteId } = useSession()
  const { data: perfil } = useAsync(() => clienteService.obterPerfil(clienteId), [clienteId])

  return (
    <div className="client-shell">
      <header className="client-header">
        <div className="client-container client-header__inner">
          <Link to="/cliente" className="client-header__brand">
            <BrandMark subtitle="Atendimento ao cliente" />
          </Link>
          <nav className="client-nav" aria-label="Portal do cliente">
            {LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => `client-nav__link ${isActive ? 'is-active' : ''}`}>
                {link.label}
              </NavLink>
            ))}
          </nav>
          {perfil && <span className="client-header__user">{perfil.nome}</span>}
        </div>
      </header>

      <main className="client-container client-content">
        <Outlet />
      </main>

      <footer className="client-footer">
        <div className="client-container client-footer__inner">
          <span>Casa Lorenzi · Oscar Freire · Iguatemi · Leblon · Pátio Batel</span>
          <Link to="/dashboard">Acesso interno</Link>
        </div>
      </footer>
    </div>
  )
}
