import { LogOut } from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { LogosDoGrupo } from '../components/LogosDoGrupo'
import { MARCAS } from '../data/marcas'
import { useMarcaPainel } from '../hooks/useMarcaPainel'
import { useSession } from '../hooks/useSession'
import { NAV_ITEMS } from './navigation'

const OPCOES_GRUPO = [
  { valor: null, rotulo: 'Todas' },
  { valor: 'LORENZI', rotulo: 'Lorenzi' },
  { valor: 'VULTO', rotulo: 'Vulto' },
]

// Topo da barra lateral: a identidade de quem está no painel. Equipe de uma marca vê a logo dela;
// o Administrador do grupo vê as duas e escolhe com qual trabalhar (Todas, Lorenzi ou Vulto)
function MarcaDoPainel({ onNavigate }) {
  const { grupo, marca, escolher } = useMarcaPainel()
  if (!grupo) {
    return (
      <Link to="/dashboard" className="sidebar__brand" onClick={onNavigate}>
        <span className={`sidebar__marca sidebar__marca--${marca.toLowerCase()}`}>
          <img src={MARCAS[marca]?.logoBranca ?? MARCAS.LORENZI.logoBranca} alt={MARCAS[marca]?.nome ?? 'Casa Lorenzi'} />
          <span className="brand__subtitle">Gestão de lojas</span>
        </span>
      </Link>
    )
  }
  return (
    <div className="sidebar__grupo">
      <Link to="/dashboard" className="sidebar__grupo-logos" onClick={onNavigate} aria-label="Painel do grupo">
        <LogosDoGrupo claro />
      </Link>
      <span className="brand__subtitle">Gestão do grupo</span>
      <div className="seletor-marca" role="radiogroup" aria-label="Marca do painel">
        {OPCOES_GRUPO.map((opcao) => (
          <button
            key={opcao.rotulo}
            type="button"
            role="radio"
            aria-checked={marca === opcao.valor}
            className={`seletor-marca__opcao seletor-marca__opcao--${(opcao.valor ?? 'todas').toLowerCase()}`}
            onClick={() => escolher(opcao.valor)}
          >
            {opcao.rotulo}
          </button>
        ))}
      </div>
    </div>
  )
}

export function Sidebar({ open, onNavigate }) {
  const { pode } = useSession()
  const navigate = useNavigate()

  return (
    <aside className={`sidebar ${open ? 'is-open' : ''}`} aria-label="Menu principal">
      <MarcaDoPainel onNavigate={onNavigate} />

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
