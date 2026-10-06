import { imagemDoProduto } from '../../data/imagensProdutos'
import { formatCurrency, formatDateTime } from '../../utils/format'
import { STATUS } from '../../utils/status'

const ETAPAS = ['PROCESSANDO', 'ENVIADO', 'ENTREGUE']
const PAGAMENTO = { PIX: 'Pix', CARTAO: 'Cartão de crédito' }

// Acompanhamento do pedido para o cliente (confirmação e "Meu pedido")
export function PedidoProgresso({ pedido }) {
  if (pedido.status === 'CANCELADO') return <p className="order-cancelled">Este pedido foi cancelado e o pagamento estornado.</p>
  const atual = ETAPAS.indexOf(pedido.status)
  const quando = (status) => pedido.historico?.find((h) => h.status === status)?.em
  return (
    <ol className="order-steps">
      {ETAPAS.map((status, i) => (
        <li key={status} className={i <= atual ? 'is-done' : ''}>
          <span className="order-steps__dot" aria-hidden="true" />
          <strong>{STATUS.pedido[status].label}</strong>
          {i <= atual && quando(status) && <small>{formatDateTime(quando(status))}</small>}
        </li>
      ))}
    </ol>
  )
}

export function PedidoDetalhesLoja({ pedido }) {
  const e = pedido.endereco
  return (
    <div className="order-details">
      <ul className="co-items">
        {pedido.itens.map((item) => (
          <li key={item.variacaoId}>
            <span className="co-items__image">
              <img src={imagemDoProduto({ id: item.variacao.produto.id })} alt="" />
              <span className="co-items__qty">{item.quantidade}</span>
            </span>
            <span className="co-items__info">
              <strong>{item.variacao.produto.nome}</strong>
              <small>
                {item.variacao.cor} · {item.variacao.tamanho}
              </small>
            </span>
            <span>{formatCurrency(item.precoUnitario * item.quantidade)}</span>
          </li>
        ))}
      </ul>

      <dl className="co-totals">
        <div>
          <dt>Subtotal</dt>
          <dd>{formatCurrency(pedido.subtotal)}</dd>
        </div>
        {pedido.frete && (
          <div>
            <dt>Frete · {pedido.frete.label}</dt>
            <dd>{pedido.frete.valor === 0 ? 'Grátis' : formatCurrency(pedido.frete.valor)}</dd>
          </div>
        )}
        <div className="co-totals__total">
          <dt>Total</dt>
          <dd>{formatCurrency(pedido.total)}</dd>
        </div>
      </dl>

      <div className="order-info">
        {e && (
          <div>
            <h3>Entrega</h3>
            <p>
              {e.rua}, {e.numero}
              {e.complemento ? ` · ${e.complemento}` : ''}
              <br />
              {e.bairro} · {e.cidade}/{e.uf}
              <br />
              CEP {e.cep.replace(/(\d{5})(\d{3})/, '$1-$2')}
            </p>
            {pedido.frete && <p className="order-info__muted">Prazo: até {pedido.frete.prazoDias} dias úteis após o envio</p>}
            {pedido.codigoRastreio && <p>Rastreio: {pedido.codigoRastreio}</p>}
          </div>
        )}
        {pedido.pagamento && (
          <div>
            <h3>Pagamento</h3>
            <p>
              {PAGAMENTO[pedido.pagamento.metodo]}
              {pedido.pagamento.metodo === 'CARTAO' && ` · ${pedido.pagamento.parcelas}x de ${formatCurrency(pedido.total / pedido.pagamento.parcelas)}`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
