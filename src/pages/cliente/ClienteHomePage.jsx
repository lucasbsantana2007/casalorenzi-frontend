import { ArrowRight, MessageSquarePlus, PackageSearch, ScrollText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SolicitacaoCard } from '../../components/atendimento/SolicitacaoCard'
import { AsyncContent } from '../../components/ui/AsyncContent'
import { EmptyState } from '../../components/ui/EmptyState'
import { useAsync } from '../../hooks/useAsync'
import { useSession } from '../../hooks/useSession'
import { clienteService } from '../../services/clienteService'

const ATALHOS = [
  { to: '/cliente/solicitacoes/nova', icon: MessageSquarePlus, titulo: 'Nova solicitação', texto: 'Trocas, devoluções, ajustes de costura e dúvidas.' },
  { to: '/cliente/solicitacoes', icon: ScrollText, titulo: 'Minhas solicitações', texto: 'Acompanhe protocolos e converse com a equipe.' },
  { to: '/cliente/pedidos', icon: PackageSearch, titulo: 'Consultar pedido', texto: 'Status, itens e rastreio das suas compras.' },
]

export function ClienteHomePage() {
  const { clienteId } = useSession()
  const perfil = useAsync(() => clienteService.obterPerfil(clienteId), [clienteId]).data
  const solicitacoes = useAsync(() => clienteService.listarSolicitacoes(clienteId), [clienteId])

  return (
    <>
      <section className="client-hero">
        <p className="eyebrow">Atendimento Casa Lorenzi</p>
        <h1 className="client-hero__title">{perfil ? `Olá, ${perfil.nome.split(' ')[0]}.` : 'Olá.'}</h1>
        <p className="client-hero__text">Como podemos ajudar hoje? Acompanhe seus pedidos e fale com a nossa equipe em um só lugar.</p>
      </section>

      <section className="shortcut-grid">
        {ATALHOS.map(({ to, icon: Icon, titulo, texto }) => (
          <Link key={to} to={to} className="shortcut">
            <Icon size={22} strokeWidth={1.4} aria-hidden="true" />
            <strong>{titulo}</strong>
            <span>{texto}</span>
            <ArrowRight size={16} className="shortcut__arrow" aria-hidden="true" />
          </Link>
        ))}
      </section>

      <section className="stack-sm">
        <div className="section-heading">
          <h2>Solicitações recentes</h2>
          <Link to="/cliente/solicitacoes" className="link">
            Ver todas
          </Link>
        </div>
        <AsyncContent state={solicitacoes} empty={<EmptyState title="Você ainda não abriu solicitações" />}>
          {(lista) => (
            <div className="request-list">
              {lista.slice(0, 3).map((s) => (
                <SolicitacaoCard key={s.id} solicitacao={s} />
              ))}
            </div>
          )}
        </AsyncContent>
      </section>
    </>
  )
}
