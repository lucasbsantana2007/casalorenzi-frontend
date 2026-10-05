import { Menu } from 'lucide-react'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Avatar } from '../components/ui/Avatar'
import { USE_MOCKS } from '../config/env'
import { useSession } from '../hooks/useSession'
import { PAPEIS } from '../utils/permissions'
import { Sidebar } from './Sidebar'

const hoje = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())

export function AdminLayout() {
  const { usuario } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)

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

        {/* key: ao trocar de perfil, a página é remontada com os padrões do novo usuário */}
        <main className="admin-content" id="conteudo" key={usuario.id}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
