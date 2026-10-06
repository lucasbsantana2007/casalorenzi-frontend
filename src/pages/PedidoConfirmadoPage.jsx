import { CircleCheck } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { PedidoDetalhesLoja, PedidoProgresso } from '../components/loja/PedidoDetalhesLoja'

export function PedidoConfirmadoPage() {
  const { numero } = useParams()
  const pedido = useLocation().state?.pedido

  return (
    <main className="store-section store-section--page order-page">
      <div className="order-hero">
        <CircleCheck size={40} strokeWidth={1.4} aria-hidden="true" />
        <h1 className="store-heading store-heading--lg">Compra confirmada</h1>
        <p>Número do pedido</p>
        <strong className="order-hero__code">{numero}</strong>
        <p className="order-hero__note">
          {pedido ? (
            <>
              Enviamos a confirmação para <strong>{pedido.contato?.email}</strong>.{' '}
            </>
          ) : null}
          Para acompanhar a entrega ou pedir trocas e ajuda, acesse <Link to="/meus-pedidos">Meus pedidos</Link> com o seu e-mail e o PIN que você criou.
        </p>
      </div>

      {pedido && (
        <div className="order-body">
          <PedidoProgresso pedido={pedido} />
          <PedidoDetalhesLoja pedido={pedido} />
        </div>
      )}

      <Link to="/" className="pdp__cta order-page__back">
        Continuar comprando
      </Link>
    </main>
  )
}
