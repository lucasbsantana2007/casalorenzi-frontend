import { Boxes, Receipt, ShoppingBag, Wallet } from 'lucide-react'
import { formatCurrency, formatNumber } from '../../utils/format'
import { Delta } from './Delta'
import { variacao } from './metricas'

export function FinanceiroStats({ resumo, comparacao }) {
  const ticket = resumo.pedidos ? resumo.receita / resumo.pedidos : 0
  const ticketAnterior = resumo.pedidosAnterior === null ? null : resumo.pedidosAnterior ? resumo.receitaAnterior / resumo.pedidosAnterior : 0

  const cards = [
    {
      label: 'Receita',
      value: formatCurrency(resumo.receita),
      delta: variacao(resumo.receita, resumo.receitaAnterior),
      hint: comparacao ?? 'pedidos não cancelados',
      icon: Wallet,
    },
    {
      label: 'Pedidos',
      value: formatNumber(resumo.pedidos),
      delta: variacao(resumo.pedidos, resumo.pedidosAnterior),
      hint: `${formatNumber(resumo.pecas)} peças · ${resumo.cancelados} cancelado${resumo.cancelados === 1 ? '' : 's'}`,
      icon: ShoppingBag,
    },
    {
      label: 'Ticket médio',
      value: formatCurrency(ticket),
      delta: variacao(ticket, ticketAnterior),
      hint: comparacao ?? 'receita ÷ pedidos',
      icon: Receipt,
    },
    {
      label: 'Valor em estoque',
      value: formatCurrency(resumo.valorEstoque),
      hint: 'hoje, a preço base de venda',
      icon: Boxes,
    },
  ]

  return cards.map(({ label, value, delta, hint, icon: Icon }) => (
    <div key={label} className="card fin-stat">
      <div className="fin-stat__top">
        <span className="fin-stat__label">{label}</span>
        <span className="fin-stat__icon" aria-hidden="true">
          <Icon size={16} strokeWidth={1.7} />
        </span>
      </div>
      <strong className="fin-stat__value">{value}</strong>
      <div className="fin-stat__foot">
        <Delta valor={delta} />
        <span>{hint}</span>
      </div>
    </div>
  ))
}
