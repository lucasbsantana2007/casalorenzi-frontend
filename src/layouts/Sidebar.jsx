import { LogOut } from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { BrandMark } from '../components/BrandMark'
import { useSession } from '../hooks/useSession'
import { NAV_ITEMS } from './navigation'

export function Sidebar({ open, onNavigate }) {
  const { pode } = useSession()
  const navigate = useNavigate()

  return (
    <aside className={`sidebar ${open ? 'is-open' : ''}`} aria-label="Menu principal">
      <Link to="/dashboard" className="sidebar__brand" onClick={onNavigate}>
        <BrandMark subtitle="Gestão de lojas" inverse />
      </Link>

      <nav className="sidebar__nav">
        {NAV_ITEMS.filter((item) => pode(item.modulo)).map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `sidebar__link ${isActive ? 'is-active' : ''}`} onClick={onNavigate}>
            <Icon size={18} strokeWidth={1.6} aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        <button
          type="button"
          className="sidebar__link sidebar__link--muted"
          onClick={() => navigate('/', { state: { sair: true } })}
        >
          <LogOut size={16} strokeWidth={1.6} aria-hidden="true" />
          Sair
        </button>
      </div>
    </aside>
  )
}
