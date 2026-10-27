import { ArrowRight, MessageSquarePlus, PackageSearch, ScrollText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SolicitacaoCard } from '../../components/atendimento/SolicitacaoCard'
import { CartaoVultoMais } from '../../components/fidelidade/CartaoVultoMais'
import { AsyncContent } from '../../components/ui/AsyncContent'
import { EmptyState } from '../../components/ui/EmptyState'
import { useAsync } from '../../hooks/useAsync'
import { useSession } from '../../hooks/useSession'
import { clienteService } from '../../services/clienteService'
import { contaService } from '../../services/contaService'

const ATALHOS = [
  { to: '/cliente/solicitacoes/nova', icon: MessageSquarePlus, titulo: 'Nova solicitação', texto: 'Trocas, devoluções, ajustes de costura e dúvidas.' },
  { to: '/cliente/solicitacoes', icon: ScrollText, titulo: 'Minhas solicitações', texto: 'Acompanhe protocolos e converse com a equipe.' },
  { to: '/cliente/pedidos', icon: PackageSearch, titulo: 'Consultar pedido', texto: 'Status, itens e rastreio das suas compras.' },
]

export function ClienteHomePage() {
  const { clienteId } = useSession()
  const perfil = useAsync(() => clienteService.obterPerfil(clienteId), [clienteId]).data
  const solicitacoes = useAsync(() => clienteService.listarSolicitacoes(clienteId), [clienteId])
  // Pedidos do cliente: as peças viram a capa das solicitações sem foto
  const pedidos = useAsync(() => clienteService.listarPedidos(clienteId), [clienteId]).data ?? []
  const pontos = useAsync(() => contaService.pontos(), [clienteId]).data

  return (
    <>
      <section className="client-hero">
        <p className="eyebrow">Sua conta · Casa Lorenzi e Vulto</p>
        <h1 className="client-hero__title">{perfil ? `Olá, ${perfil.nome.split(' ')[0]}.` : 'Olá.'}</h1>
        <p className="client-hero__text">Como podemos ajudar hoje? Acompanhe seus pedidos e fale com a nossa equipe em um só lugar.</p>
      </section>

      {pontos && (
        <Link to="/cliente/pontos" className="vulto-home" aria-label="Ver o extrato Helo">
          <CartaoVultoMais pontos={pontos} compacto />
        </Link>
      )}

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
            <div className="client-card-grid">
              {lista.slice(0, 2).map((s) => (
                <SolicitacaoCard key={s.id} solicitacao={s} pedido={pedidos.find((p) => p.id === s.pedidoId)} />
              ))}
            </div>
          )}
        </AsyncContent>
      </section>
    </>
  )
}
