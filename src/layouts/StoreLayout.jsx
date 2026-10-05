import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { StoreFooter } from '../components/home/StoreFooter'
import { StoreHeader } from '../components/home/StoreHeader'
import { useSession } from '../hooks/useSession'

// Layout público da loja (início, coleções e lojas).
export function StoreLayout() {
  const { logout } = useSession()
  const location = useLocation()
  const navigate = useNavigate()
  const sair = location.state?.sair

  // "Sair" navega para o início com { sair: true }; a sessão é encerrada só aqui, depois que
  // as áreas protegidas já foram desmontadas (evita o redirecionamento para o login).
  useEffect(() => {
    if (!sair) return
    logout()
    navigate('/', { replace: true, state: null })
  }, [sair, logout, navigate])

  return (
    <div className="store">
      <StoreHeader overlay={location.pathname === '/'} />
      <Outlet />
      <StoreFooter />
    </div>
  )
}
