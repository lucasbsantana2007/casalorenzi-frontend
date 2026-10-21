import { Package } from 'lucide-react'
import { imagensDoPedido } from '../../data/imagensProdutos'
import { formatCurrency, formatDate } from '../../utils/format'
import { StatusBadge } from '../ui/StatusBadge'
import { CapaDoCard } from './CapaDoCard'

// Pedido no portal do cliente: fotos das peças em cima, número, status, itens e total embaixo
export function PedidoCard({ pedido, selecionado = false, onClick }) {
  return (
    <button type="button" className={`client-card ${selecionado ? 'is-selected' : ''}`} onClick={onClick}>
      <CapaDoCard imagens={imagensDoPedido(pedido)} icone={Package} />
      <div className="client-card__corpo">
        <div className="row">
          <span className="mono subtle">{pedido.numero}</span>
          <StatusBadge type="pedido" value={pedido.status} />
        </div>
        <strong className="client-card__titulo">{pedido.itens.map((i) => i.variacao.produto.nome).join(' · ')}</strong>
        <span className="subtle">
          {pedido.canal}
          {pedido.canal === 'Loja física' ? ` · ${pedido.loja.nome}` : ''}
        </span>
        <div className="client-card__rodape">
          <strong>{formatCurrency(pedido.total)}</strong>
          <span className="subtle">{formatDate(pedido.criadoEm)}</span>
        </div>
      </div>
    </button>
  )
}
