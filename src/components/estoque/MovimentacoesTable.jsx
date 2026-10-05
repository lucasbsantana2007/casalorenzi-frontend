import { Link } from 'react-router-dom'
import { formatDateTime, formatNumber, formatRelative, formatSigned } from '../../utils/format'
import { DataTable } from '../ui/DataTable'
import { StatusBadge } from '../ui/StatusBadge'

export function Quantidade({ value }) {
  return <span className={`qty ${value > 0 ? 'qty--positive' : 'qty--negative'}`}>{formatSigned(value)}</span>
}

// Tabela de movimentações reutilizada no dashboard, no histórico do item e no registro geral.
// showItem: exibe produto/SKU/loja (oculto no histórico de um item específico)
// compact: versão resumida para o dashboard (data relativa, sem saldo e origem)
export function MovimentacoesTable({ rows, showItem = true, compact = false, pageSize = 20 }) {
  const columns = [
    { key: 'criadoEm', header: compact ? 'Quando' : 'Data', render: (m) => <span className="nowrap">{compact ? formatRelative(m.criadoEm) : formatDateTime(m.criadoEm)}</span> },
    showItem && {
      key: 'item',
      header: 'Item',
      render: (m) => (
        <Link to={`/estoque/${m.estoqueId}`} className="cell-link" onClick={(e) => e.stopPropagation()}>
          <span className="cell-main">{m.produto.nome}</span>
          <span className="cell-sub">
            {m.variacao.sku} · {m.loja.nome}
          </span>
        </Link>
      ),
    },
    { key: 'tipo', header: 'Tipo', render: (m) => <StatusBadge type="movimentacao" value={m.tipo} /> },
    { key: 'quantidade', header: 'Qtd.', align: 'right', render: (m) => <Quantidade value={m.quantidade} /> },
    !compact && { key: 'saldo', header: 'Saldo', align: 'right', render: (m) => formatNumber(m.saldoResultante) },
    { key: 'usuario', header: 'Usuário', render: (m) => <span className="nowrap">{m.usuario?.nome ?? '—'}</span> },
    !compact && { key: 'origem', header: 'Origem', render: (m) => <span className="muted">{m.origem}</span> },
  ].filter(Boolean)

  return <DataTable columns={columns} rows={rows} pageSize={pageSize} caption="Movimentações de estoque" />
}
