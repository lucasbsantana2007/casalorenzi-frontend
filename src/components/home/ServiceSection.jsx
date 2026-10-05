import { ArrowRight, MessageSquareText, Package, RefreshCcw, Scissors, Undo2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAsync } from '../../hooks/useAsync'
import { useSession } from '../../hooks/useSession'
import { cadastrosService } from '../../services/cadastrosService'
import { clienteService } from '../../services/clienteService'
import { SolicitacaoCard } from '../atendimento/SolicitacaoCard'
import { FlutedBackdrop } from '../auth/FlutedBackdrop'

const ICONES = { 1: RefreshCcw, 2: Undo2, 3: Package, 4: Scissors }

// Atendimento em destaque na página inicial: serviços e, para clientes logados, seus atendimentos.
export function ServiceSection() {
  const { isCliente, clienteId } = useSession()
  const tipos = useAsync(() => cadastrosService.listarTiposSolicitacao(), []).data ?? []
  const solicitacoes = useAsync(() => (isCliente ? clienteService.listarSolicitacoes(clienteId) : Promise.resolve([])), [isCliente, clienteId]).data ?? []

  return (
    <section id="atendimento" className="service-band">
      <FlutedBackdrop />
      <div className="store-container service-band__inner">
        <div className="service-band__intro">
          <p className="store-eyebrow store-eyebrow--light">Atendimento Casa Lorenzi</p>
          <h2 className="store-title store-title--light">Trocas, ajustes e dúvidas, com a mesma atenção da loja.</h2>
          <p className="service-band__text">Abra uma solicitação, converse com a equipe e acompanhe tudo pelo número de protocolo.</p>
        </div>

        <ul className="service-grid">
          {tipos
            .filter((t) => ICONES[t.id])
            .map((tipo) => {
              const Icon = ICONES[tipo.id]
              return (
                <li key={tipo.id}>
                  <Link to={`/cliente/solicitacoes/nova?tipo=${tipo.id}`} className="service-card">
                    <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
                    <strong>{tipo.titulo}</strong>
                    <span>{tipo.descricao}</span>
                  </Link>
                </li>
              )
            })}
        </ul>

        <div className="service-band__mine">
          <div className="service-band__mine-header">
            <h3>
              <MessageSquareText size={18} aria-hidden="true" /> Seus atendimentos
            </h3>
            {isCliente && (
              <Link to="/cliente/solicitacoes" className="service-band__link">
                Ver todos <ArrowRight size={14} />
              </Link>
            )}
          </div>
          {isCliente ? (
            solicitacoes.length ? (
              <div className="request-list">
                {solicitacoes.slice(0, 3).map((s) => (
                  <SolicitacaoCard key={s.id} solicitacao={s} />
                ))}
              </div>
            ) : (
              <p className="service-band__text">Você ainda não abriu nenhuma solicitação.</p>
            )
          ) : (
            <div className="service-band__login">
              <p className="service-band__text">Entre na sua conta para acompanhar protocolos e conversar com a equipe.</p>
              <Link to="/login" className="store-btn store-btn--light">
                Entrar na minha conta
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
