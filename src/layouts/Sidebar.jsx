import { ExternalLink } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { BrandMark } from '../components/BrandMark'
import { PERFIS_DEMO } from '../context/perfisDemo'
import { useSession } from '../hooks/useSession'
import { PAPEIS } from '../utils/permissions'
import { NAV_ITEMS } from './navigation'

export function Sidebar({ open, onNavigate }) {
  const { usuario, pode, trocarPerfil } = useSession()

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
        <label className="sidebar__profile">
          <span>Perfil de acesso (demo)</span>
          <select value={usuario.id} onChange={(e) => trocarPerfil(e.target.value)}>
            {PERFIS_DEMO.map((perfil) => (
              <option key={perfil.id} value={perfil.id}>
                {PAPEIS[perfil.papel]} · {perfil.nome.split(' ')[0]}
              </option>
            ))}
          </select>
        </label>
        <Link to="/cliente" className="sidebar__link sidebar__link--muted" onClick={onNavigate}>
          <ExternalLink size={16} strokeWidth={1.6} aria-hidden="true" />
          Portal do cliente
        </Link>
      </div>
    </aside>
  )
}
