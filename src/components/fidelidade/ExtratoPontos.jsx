import { formatCurrency, formatDateTime } from '../../utils/format'
import { TIPOS_MOVIMENTO } from '../../utils/fidelidade'

// Extrato do Helo, mais recente primeiro. limite: quantos movimentos mostrar (painel mostra menos)
export function ExtratoPontos({ extrato, limite }) {
  const lista = limite ? extrato.slice(0, limite) : extrato
  if (!lista.length) return <p className="muted">Nenhuma movimentação de pontos ainda.</p>
  return (
    <ul className="extrato-pontos">
      {lista.map((mov) => (
        <li key={mov.id}>
          <div className="extrato-pontos__info">
            <strong>
              {TIPOS_MOVIMENTO[mov.tipo] ?? mov.tipo}
              {mov.pedidoNumero && <span className="extrato-pontos__pedido"> · {mov.pedidoNumero}</span>}
            </strong>
            <span>
              {formatDateTime(mov.criadoEm)}
              {mov.obs && ` · ${mov.obs}`}
              {mov.valorDesconto != null && ` · desconto de ${formatCurrency(mov.valorDesconto)}`}
            </span>
          </div>
          <div className={`extrato-pontos__qtd ${mov.quantidade > 0 ? 'is-entrada' : 'is-saida'}`}>
            {mov.quantidade > 0 ? '+' : '−'}
            {Math.abs(mov.quantidade).toLocaleString('pt-BR')}
            <small>saldo {mov.saldo.toLocaleString('pt-BR')}</small>
          </div>
        </li>
      ))}
    </ul>
  )
}
