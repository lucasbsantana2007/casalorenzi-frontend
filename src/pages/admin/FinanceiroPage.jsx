import { AsyncContent } from '../../components/ui/AsyncContent'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatCard } from '../../components/ui/StatCard'
import { useAsync } from '../../hooks/useAsync'
import { financeiroService } from '../../services/financeiroService'
import { formatCurrency, formatNumber } from '../../utils/format'

export function FinanceiroPage() {
  const state = useAsync(() => financeiroService.obterResumo(), [])

  return (
    <>
      <PageHeader eyebrow="Gestão" title="Financeiro" description="Visão preliminar de receita e capital imobilizado em estoque, por loja e categoria." />
      <AsyncContent state={state} isEmpty={() => false}>
        {(r) => {
          const maxCategoria = Math.max(...r.porCategoria.map((c) => c.valorEstoque), 1)
          return (
            <>
              <section className="kpi-grid kpi-grid--4">
                <StatCard label="Receita · 30 dias" value={formatCurrency(r.receita30d)} hint="pedidos não cancelados" />
                <StatCard label="Pedidos · 30 dias" value={formatNumber(r.pedidos30d)} hint="loja física e e-commerce" />
                <StatCard label="Ticket médio" value={formatCurrency(r.pedidos30d ? r.receita30d / r.pedidos30d : 0)} hint="últimos 30 dias" />
                <StatCard label="Valor em estoque" value={formatCurrency(r.valorEstoque)} hint="a preço base de venda" />
              </section>

              <section className="dashboard-grid">
                <div className="card">
                  <div className="card__header">
                    <div>
                      <h2 className="card__title">Desempenho por loja</h2>
                      <p className="card__subtitle">Últimos 30 dias</p>
                    </div>
                  </div>
                  <div className="table-wrap">
                    <div className="table-scroll">
                      <table className="table">
                        <thead>
                          <tr>
                            <th scope="col">Loja</th>
                            <th scope="col" className="align-right">Receita</th>
                            <th scope="col" className="align-right">Pedidos</th>
                            <th scope="col" className="align-right">Ticket médio</th>
                            <th scope="col" className="align-right">Valor em estoque</th>
                          </tr>
                        </thead>
                        <tbody>
                          {r.porLoja.map((l) => (
                            <tr key={l.loja.id}>
                              <td className="cell-main">{l.loja.nome}</td>
                              <td className="align-right">{formatCurrency(l.receita30d)}</td>
                              <td className="align-right">{l.pedidos30d}</td>
                              <td className="align-right">{formatCurrency(l.ticketMedio)}</td>
                              <td className="align-right">{formatCurrency(l.valorEstoque)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card__header">
                    <div>
                      <h2 className="card__title">Estoque por categoria</h2>
                      <p className="card__subtitle">Valor a preço base</p>
                    </div>
                  </div>
                  <ul className="bar-list">
                    {r.porCategoria.map((c) => (
                      <li key={c.categoria}>
                        <div className="bar-list__label">
                          <span>{c.categoria}</span>
                          <strong>{formatCurrency(c.valorEstoque)}</strong>
                        </div>
                        <span className="bar-list__bar" aria-hidden="true">
                          <span style={{ width: `${(c.valorEstoque / maxCategoria) * 100}%` }} />
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            </>
          )
        }}
      </AsyncContent>
    </>
  )
}
