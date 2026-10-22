import { Menu } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Avatar } from '../components/ui/Avatar'
import { MODO_DEMO, USE_MOCKS } from '../config/env'
import { useMarcaPainel } from '../hooks/useMarcaPainel'
import { useSession } from '../hooks/useSession'
import { PAPEIS } from '../utils/permissions'
import { Sidebar } from './Sidebar'

const hoje = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())

export function AdminLayout() {
  const { usuario, isEquipe } = useSession()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const { grupo, marca } = useMarcaPainel()
  // Identidade do painel: a da marca do funcionário; o grupo é neutro e ganha a cor da marca escolhida
  const tema = grupo ? `painel--grupo painel--grupo-${(marca ?? 'todas').toLowerCase()}` : `painel--${marca.toLowerCase()}`
  // Objeto estável: <Navigate> redireciona de novo sempre que o state muda de identidade
  const from = `${location.pathname}${location.search}`
  const redirectState = useMemo(() => ({ from }), [from])

  // Sem sessão da equipe: vai para o login e volta para a página pedida depois de entrar
  if (!isEquipe) return <Navigate to="/login" replace state={redirectState} />

  return (
    <div className={`admin-shell ${tema}`}>
      <Sidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} />
      {menuOpen && <div className="sidebar-backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />}

      <div className="admin-main">
        <header className="topbar">
          <button type="button" className="btn btn-ghost btn-icon topbar__menu" onClick={() => setMenuOpen(true)} aria-label="Abrir menu">
            <Menu size={20} />
          </button>
          <span className="topbar__date">{hoje}</span>
          {MODO_DEMO && (
            <span
              className="topbar__env"
              title={USE_MOCKS ? 'Dados de demonstração no navegador (VITE_USE_MOCKS=true)' : 'API conectada, com dados de demonstração carregados pelo seed'}
            >
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

        {/* key: ao trocar de usuário ou de marca no seletor do grupo, a página é remontada e recarrega */}
        <main className="admin-content" id="conteudo" key={`${usuario.id}-${marca ?? 'todas'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
