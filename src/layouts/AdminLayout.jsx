import { Menu } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Avatar } from '../components/ui/Avatar'
import { USE_MOCKS } from '../config/env'
import { useSession } from '../hooks/useSession'
import { PAPEIS } from '../utils/permissions'
import { Sidebar } from './Sidebar'

const hoje = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())

export function AdminLayout() {
  const { usuario, isEquipe } = useSession()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  // Objeto estável: <Navigate> redireciona de novo sempre que o state muda de identidade
  const from = `${location.pathname}${location.search}`
  const redirectState = useMemo(() => ({ from }), [from])

  // Sem sessão da equipe: vai para o login e volta para a página pedida depois de entrar
  if (!isEquipe) return <Navigate to="/login/equipe" replace state={redirectState} />

  return (
    <div className="admin-shell">
      <Sidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} />
      {menuOpen && <div className="sidebar-backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />}

      <div className="admin-main">
        <header className="topbar">
          <button type="button" className="btn btn-ghost btn-icon topbar__menu" onClick={() => setMenuOpen(true)} aria-label="Abrir menu">
            <Menu size={20} />
          </button>
          <span className="topbar__date">{hoje}</span>
          {USE_MOCKS && (
            <span className="topbar__env" title="Defina VITE_USE_MOCKS=false para usar a API real">
              Dados de demonstração
            </span>
          )}
          <div className="topbar__user">
            <div className="topbar__user-text">
              <strong>{usuario.nome}</strong>
              <span>{PAPEIS[usuario.papel]}</span>
            </div>
            <Avatar name={usuario.nome} />
          </div>
        </header>

        {/* key: ao trocar de usuário, a página é remontada com os padrões do novo perfil */}
        <main className="admin-content" id="conteudo" key={usuario.id}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
