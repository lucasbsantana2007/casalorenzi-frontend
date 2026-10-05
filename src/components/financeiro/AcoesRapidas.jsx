import { ArrowLeftRight, ChevronRight, Download, History, PackagePlus } from 'lucide-react'
import { Link } from 'react-router-dom'

// Exporta o desempenho por loja já filtrado em CSV (separador ; para abrir direto no Excel em pt-BR)
function exportarCsv(porLoja, periodo) {
  const linhas = [
    ['Período', periodo],
    [],
    ['Loja', 'Receita', 'Receita comparação', 'Pedidos', 'Ticket médio', 'Valor em estoque'],
    ...porLoja.map((l) => [l.loja.nome, l.receita, l.receitaAnterior ?? '', l.pedidos, l.ticketMedio, l.valorEstoque]),
  ]
  const celula = (v) => (typeof v === 'number' ? (Number.isInteger(v) ? String(v) : v.toFixed(2)).replace('.', ',') : `"${String(v).replace(/"/g, '""')}"`)
  const csv = linhas.map((linha) => linha.map(celula).join(';')).join('\n')
  const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }))
  const link = Object.assign(document.createElement('a'), { href: url, download: 'financeiro-por-loja.csv' })
  link.click()
  URL.revokeObjectURL(url)
}

const ATALHOS = [
  { to: '/produtos', label: 'Cadastrar produto', descricao: 'Preços e variações', icon: PackagePlus },
  { to: '/estoque/historico', label: 'Posição em data', descricao: 'Estoque em um dia passado', icon: History },
  { to: '/transferencias', label: 'Transferências', descricao: 'Remanejar entre lojas', icon: ArrowLeftRight },
]

export function AcoesRapidas({ porLoja, periodo }) {
  return (
    <div className="card fin-span-1">
      <div className="card__header">
        <div>
          <h2 className="card__title">Ações rápidas</h2>
          <p className="card__subtitle">Atalhos da gestão</p>
        </div>
      </div>
      <ul className="fin-actions">
        <li>
          <button type="button" className="fin-action" onClick={() => exportarCsv(porLoja, periodo)}>
            <span className="fin-action__icon">
              <Download size={16} />
            </span>
            <span className="fin-action__text">
              <strong>Exportar relatório</strong>
              <span>Por loja, com os filtros atuais (CSV)</span>
            </span>
            <ChevronRight size={16} className="fin-action__chevron" aria-hidden="true" />
          </button>
        </li>
        {ATALHOS.map(({ to, label, descricao, icon: Icon }) => (
          <li key={to}>
            <Link to={to} className="fin-action">
              <span className="fin-action__icon">
                <Icon size={16} />
              </span>
              <span className="fin-action__text">
                <strong>{label}</strong>
                <span>{descricao}</span>
              </span>
              <ChevronRight size={16} className="fin-action__chevron" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
