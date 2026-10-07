import { LogOut } from 'lucide-react'
import { useMemo } from 'react'
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { StoreFooter } from '../components/home/StoreFooter'
import { StoreHeader } from '../components/home/StoreHeader'
import { useSession } from '../hooks/useSession'

const LINKS = [
  { to: '/cliente', label: 'Minha conta', end: true },
  { to: '/cliente/solicitacoes', label: 'Solicitações' },
  { to: '/cliente/pedidos', label: 'Pedidos' },
  { to: '/cliente/conta', label: 'Configurações' },
]

// Área do cliente: mesmo cabeçalho e rodapé da loja, com navegação própria abaixo.
export function ClientLayout() {
  const { usuario, isCliente } = useSession()
  const location = useLocation()
  const navigate = useNavigate()
  // Objeto estável: <Navigate> redireciona de novo sempre que o state muda de identidade
  const from = `${location.pathname}${location.search}`
  const redirectState = useMemo(() => ({ from }), [from])

  if (!isCliente) return <Navigate to="/login" replace state={redirectState} />

  return (
    <div className="store">
      <StoreHeader />

      <div className="client-bar">
        <nav className="client-bar__nav" aria-label="Área do cliente">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => (isActive ? 'is-active' : undefined)}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="client-bar__user">
          <span>{usuario.nome}</span>
          <button type="button" onClick={() => navigate('/', { state: { sair: true } })}>
            <LogOut size={14} aria-hidden="true" /> Sair
          </button>
        </div>
      </div>

      <main className="client-content">
        <Outlet />
      </main>

      <StoreFooter />
    </div>
  )
}
