import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BarraDeMarcas } from '../components/home/BarraDeMarcas'
import { StoreFooter } from '../components/home/StoreFooter'
import { StoreHeader } from '../components/home/StoreHeader'
import { SacolaLateral } from '../components/loja/SacolaLateral'
import { useBarraNoTopo } from '../hooks/useBarraNoTopo'
import { useMarca } from '../hooks/useMarca'
import { useSession } from '../hooks/useSession'

// Layout público da loja (início, coleções e lojas), com a faixa das marcas no topo.
// A vitrine da Vulto (/vulto) usa o mesmo layout com a identidade dela (classe store--vulto).
export function StoreLayout() {
  const { logout } = useSession()
  const marca = useMarca()
  const barraAberta = useBarraNoTopo()
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
    <div className={`store store--${marca.id.toLowerCase()} ${barraAberta ? 'store--barra-aberta' : ''}`}>
      <BarraDeMarcas aberta={barraAberta} />
      <StoreHeader overlay={location.pathname === '/'} />
      <Outlet />
      <StoreFooter />
      <SacolaLateral />
    </div>
  )
}
