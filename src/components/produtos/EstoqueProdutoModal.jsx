import { History } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAsync } from '../../hooks/useAsync'
import { estoqueService } from '../../services/estoqueService'
import { formatCurrency, formatNumber } from '../../utils/format'
import { formatarMargem, margem } from '../../utils/margem'
import { AsyncContent } from '../ui/AsyncContent'
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

const TOM = { SEM_ESTOQUE: 'text-danger', BAIXO: 'text-warning' }

// Produto na tela Estoque: grade de variações (custo e margem) e o estoque de cada variação em cada loja
export function EstoqueProdutoModal({ produto, onClose }) {
  return (
    <Modal
      open={Boolean(produto)}
      onClose={onClose}
      size="lg"
      title={produto?.nome ?? ''}
      description={produto ? `${produto.categoria} · ${formatCurrency(produto.precoBase)} · ${produto.variacoes.length} variações` : ''}
    >
      {produto && (
        <div className="stack">
          <DataTable columns={colunas(produto.precoBase)} rows={produto.variacoes} pageSize={50} caption="Variações do produto" />
          <EstoquePorLoja produto={produto} />
        </div>
      )}
    </Modal>
  )
}

function EstoquePorLoja({ produto }) {
  // A busca da API é por texto; o filtro pelo id garante que só entram as peças deste produto
  const state = useAsync(() => estoqueService.listar({ busca: produto.nome }), [produto.id])
  const itens = (state.data ?? []).filter((e) => e.produto.id === produto.id)
  const lojas = [...new Map(itens.map((e) => [e.loja.id, e.loja])).values()].sort((a, b) => a.id - b.id)
  const celula = (variacaoId, lojaId) => itens.find((e) => e.variacaoId === variacaoId && e.loja.id === lojaId)

  return (
    <section className="stack-sm" aria-labelledby="estoque-por-loja">
      <div className="section-heading">
        <h3 id="estoque-por-loja">Estoque por loja</h3>
        <Link to={`/estoque/posicao?busca=${encodeURIComponent(produto.nome)}`} className="link">
          Ver na posição atual
        </Link>
      </div>
      <AsyncContent state={{ ...state, data: state.data && itens }}>
        {() => (
          <div className="table-wrap">
            <div className="table-scroll">
              <table className="table table--cruzada">
                <caption className="sr-only">Estoque de cada variação em cada loja</caption>
                <thead>
                  <tr>
                    <th scope="col">Variação</th>
                    {lojas.map((loja) => (
                      <th key={loja.id} scope="col" className="align-right">
                        {loja.nome}
                      </th>
                    ))}
                    <th scope="col" className="align-right">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {produto.variacoes.map((v) => (
                    <tr key={v.id}>
                      <th scope="row">
                        <span className="cell-main mono">{v.sku}</span>
                        <span className="cell-sub">
                          {v.cor} · {v.tamanho}
                        </span>
                      </th>
                      {lojas.map((loja) => {
                        const e = celula(v.id, loja.id)
                        return (
                          <td key={loja.id} className="align-right">
                            {e ? (
                              <Link
                                to={`/estoque/${e.id}`}
                                className={`qty cell-link ${TOM[e.status] ?? ''}`}
                                title={`Histórico de ${v.sku} em ${loja.nome}`}
                                aria-label={`${formatNumber(e.quantidade)} em ${loja.nome}: ver histórico de ${v.sku}`}
                              >
                                {formatNumber(e.quantidade)}
                              </Link>
                            ) : (
                              <span className="muted">—</span>
                            )}
                          </td>
                        )
                      })}
                      <td className="align-right">
                        <span className="qty">{formatNumber(itens.filter((e) => e.variacaoId === v.id).reduce((s, e) => s + e.quantidade, 0))}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </AsyncContent>
      <p className="subtle row">
        <History size={13} aria-hidden="true" /> Clique numa quantidade para ver o histórico da peça naquela loja e registrar movimentações.
      </p>
    </section>
  )
}
