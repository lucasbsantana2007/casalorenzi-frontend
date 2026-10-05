import { formatCurrency, formatDate } from '../../utils/format'
import { StatusBadge } from '../ui/StatusBadge'

// Itens e dados básicos de um pedido. Usado no atendimento interno e no portal do cliente.
export function PedidoResumo({ pedido }) {
  return (
    <div className="order">
      <dl className="details-list">
        <div>
          <dt>Pedido</dt>
          <dd className="mono">{pedido.numero}</dd>
        </div>
        <div>
          <dt>Data</dt>
          <dd>{formatDate(pedido.criadoEm)}</dd>
        </div>
        <div>
          <dt>Canal</dt>
          <dd>
            {pedido.canal}
            {pedido.canal === 'Loja física' ? ` · ${pedido.loja.nome}` : ''}
          </dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>
            <StatusBadge type="pedido" value={pedido.status} />
          </dd>
        </div>
        {pedido.codigoRastreio && (
          <div>
            <dt>Rastreio</dt>
            <dd className="mono">{pedido.codigoRastreio}</dd>
          </div>
        )}
      </dl>
      <ul className="order__items">
        {pedido.itens.map((item, index) => (
          <li key={`${item.variacaoId}-${index}`}>
            <span>
              <strong>{item.variacao.produto.nome}</strong>
              <span className="subtle">
                {item.variacao.cor} · {item.variacao.tamanho} · {item.quantidade} un.
              </span>
            </span>
            <span className="nowrap">{formatCurrency(item.precoUnitario * item.quantidade)}</span>
          </li>
        ))}
      </ul>
      <div className="order__total">
        <span>Total</span>
        <strong>{formatCurrency(pedido.total)}</strong>
      </div>
    </div>
  )
}
