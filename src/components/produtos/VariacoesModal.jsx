import { formatCurrency, formatNumber } from '../../utils/format'
import { formatarMargem, margem } from '../../utils/margem'
import { DataTable } from '../ui/DataTable'
import { Modal } from '../ui/Modal'

const colunas = (precoBase) => [
  { key: 'sku', header: 'SKU', render: (v) => <span className="mono">{v.sku}</span> },
  { key: 'cor', header: 'Cor' },
  { key: 'tamanho', header: 'Tamanho' },
  { key: 'precoCusto', header: 'Custo', align: 'right', render: (v) => <span className="nowrap">{v.precoCusto === undefined ? '—' : formatCurrency(v.precoCusto)}</span> },
  { key: 'margem', header: 'Margem', align: 'right', render: (v) => formatarMargem(margem(precoBase, v.precoCusto)) },
  { key: 'estoqueTotal', header: 'Estoque na rede', align: 'right', render: (v) => <span className="qty">{formatNumber(v.estoqueTotal)}</span> },
]

export function VariacoesModal({ produto, onClose }) {
  return (
    <Modal
      open={Boolean(produto)}
      onClose={onClose}
      size="lg"
      title={produto?.nome ?? ''}
      description={produto ? `${produto.categoria} · ${formatCurrency(produto.precoBase)} · ${produto.variacoes.length} variações` : ''}
    >
      {produto && <DataTable columns={colunas(produto.precoBase)} rows={produto.variacoes} pageSize={50} caption="Variações do produto" />}
    </Modal>
  )
}
