import { MessageSquare } from 'lucide-react'
import { Link } from 'react-router-dom'
import { imagensDoPedido } from '../../data/imagensProdutos'
import { formatDate, formatRelative } from '../../utils/format'
import { StatusBadge } from '../ui/StatusBadge'
import { CapaDoCard } from './CapaDoCard'

// Solicitação no portal do cliente. Capa: a foto que o cliente anexou; sem ela, as peças do pedido
// ligado à solicitação (`pedido`, opcional); sem nenhum dos dois, um ícone.
export function SolicitacaoCard({ solicitacao, pedido }) {
  const imagens = solicitacao.foto ? [solicitacao.foto.url] : pedido ? imagensDoPedido(pedido) : []
  return (
    <Link to={`/cliente/solicitacoes/${solicitacao.id}`} className="client-card">
      <CapaDoCard imagens={imagens} icone={MessageSquare} />
      <div className="client-card__corpo">
        <div className="row">
          <span className="mono subtle">{solicitacao.protocolo}</span>
          <StatusBadge type="atendimento" value={solicitacao.status} />
        </div>
        <strong className="client-card__titulo">{solicitacao.tipoSolicitacao.titulo}</strong>
        {solicitacao.ultimaMensagem && <p className="client-card__resumo">{solicitacao.ultimaMensagem.conteudo}</p>}
        <div className="client-card__rodape">
          <span>Aberta em {formatDate(solicitacao.criadoEm)}</span>
          <span className="subtle">Atualizada {formatRelative(solicitacao.atualizadoEm)}</span>
        </div>
      </div>
    </Link>
  )
}
