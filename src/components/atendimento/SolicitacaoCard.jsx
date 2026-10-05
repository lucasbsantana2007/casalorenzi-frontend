import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatDate, formatRelative } from '../../utils/format'
import { StatusBadge } from '../ui/StatusBadge'

// Linha de solicitação no portal do cliente
export function SolicitacaoCard({ solicitacao }) {
  return (
    <Link to={`/cliente/solicitacoes/${solicitacao.id}`} className="request-card">
      <div className="request-card__main">
        <div className="row">
          <span className="mono subtle">{solicitacao.protocolo}</span>
          <StatusBadge type="atendimento" value={solicitacao.status} />
        </div>
        <strong>{solicitacao.tipoSolicitacao.titulo}</strong>
        {solicitacao.ultimaMensagem && <p className="request-card__preview">{solicitacao.ultimaMensagem.conteudo}</p>}
      </div>
      <div className="request-card__side">
        <span>Aberta em {formatDate(solicitacao.criadoEm)}</span>
        <span className="subtle">Atualizada {formatRelative(solicitacao.atualizadoEm)}</span>
      </div>
      <ChevronRight size={18} className="request-card__chevron" aria-hidden="true" />
    </Link>
  )
}
