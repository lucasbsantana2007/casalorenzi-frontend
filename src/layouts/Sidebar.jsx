import { ChevronDown, LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { BrandMark } from '../components/BrandMark'
import { useSession } from '../hooks/useSession'
import { MENU_ADMINISTRADOR, NAV_ITEMS } from './navigation'

const CHAVE_GRUPOS = 'casalorenzi.menu-grupos'
const itemPorCaminho = (to) => NAV_ITEMS.find((item) => item.to === to)
const estaDentro = (pathname, to) => pathname === to || pathname.startsWith(`${to}/`)

function LinkMenu({ item, onNavigate, sub = false }) {
  const { to, label, icon: Icon } = item
  return (
    <NavLink to={to} className={({ isActive }) => `sidebar__link ${sub ? 'sidebar__link--sub' : ''} ${isActive ? 'is-active' : ''}`} onClick={onNavigate}>
      <Icon size={sub ? 16 : 18} strokeWidth={1.6} aria-hidden="true" />
      {label}
    </NavLink>
  )
}

// O que a pessoa abriu ou fechou fica guardado no navegador (só conveniência).
// Grupo em que ela nunca mexeu começa aberto se a página atual está dentro dele.
function lerGrupos() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_GRUPOS)) ?? {}
  } catch {
    return {}
  }
}

function MenuAdministrador({ onNavigate }) {
  const { pathname } = useLocation()
  const [abertos, setAbertos] = useState(lerGrupos)

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE_GRUPOS, JSON.stringify(abertos))
    } catch {
      // Sem armazenamento: os grupos só não ficam lembrados
    }
  }, [abertos])

  return MENU_ADMINISTRADOR.map((entrada) => {
    if (!entrada.grupo) return <LinkMenu key={entrada.to} item={itemPorCaminho(entrada.to)} onNavigate={onNavigate} />
    const { grupo, label, icon: Icon, itens } = entrada
    const ativoDentro = itens.some((to) => estaDentro(pathname, to))
    const aberto = abertos[grupo] ?? ativoDentro
    const listaId = `menu-grupo-${grupo}`
    return (
      <div key={grupo} className="sidebar__grupo">
        <button
          type="button"
          className={`sidebar__link sidebar__grupo-botao ${ativoDentro && !aberto ? 'is-ativo-dentro' : ''}`}
          aria-expanded={aberto}
          aria-controls={listaId}
          onClick={() => setAbertos((a) => ({ ...a, [grupo]: !aberto }))}
        >
          <Icon size={18} strokeWidth={1.6} aria-hidden="true" />
          {label}
          <ChevronDown size={15} className="sidebar__grupo-seta" aria-hidden="true" />
        </button>
        {aberto && (
          <div id={listaId} className="sidebar__grupo-itens">
            {itens.map((to) => (
              <LinkMenu key={to} item={itemPorCaminho(to)} onNavigate={onNavigate} sub />
            ))}
          </div>
        )}
      </div>
    )
  })
}

export function Sidebar({ open, onNavigate }) {
  const { usuario, pode } = useSession()
  const navigate = useNavigate()

  return (
    <aside className={`sidebar ${open ? 'is-open' : ''}`} aria-label="Menu principal">
      <Link to="/dashboard" className="sidebar__brand" onClick={onNavigate}>
        <BrandMark subtitle="Gestão de lojas" inverse />
      </Link>

      <nav className="sidebar__nav">
        {usuario.papel === 'ADMINISTRADOR' ? (
          <MenuAdministrador onNavigate={onNavigate} />
        ) : (
          NAV_ITEMS.filter((item) => pode(item.modulo)).map((item) => <LinkMenu key={item.to} item={item} onNavigate={onNavigate} />)
        )}
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
