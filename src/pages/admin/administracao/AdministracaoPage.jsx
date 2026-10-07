import { Outlet } from 'react-router-dom'
import { PageHeader } from '../../../components/ui/PageHeader'
import { NavTabs } from '../../../components/ui/Tabs'

const ABAS = [
  { to: '/administracao/funcionarios', label: 'Funcionários' },
  { to: '/administracao/lojas', label: 'Lojas' },
  { to: '/administracao/frete', label: 'Frete' },
  { to: '/administracao/log', label: 'Log de ações' },
]

// Central administrativa (só Administrador): cabeçalho e abas comuns; cada aba é uma rota
export function AdministracaoPage() {
  return (
    <>
      <PageHeader eyebrow="Central administrativa" title="Administração" description="Equipe, lojas e frete da rede. Toda alteração fica registrada no log de ações." />
      <NavTabs items={ABAS} label="Áreas da administração" />
      <Outlet />
    </>
  )
}
