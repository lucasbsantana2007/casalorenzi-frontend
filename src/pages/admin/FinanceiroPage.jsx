import { useSearchParams } from 'react-router-dom'
import { AcoesRapidas } from '../../components/financeiro/AcoesRapidas'
import { CategoriaRanking } from '../../components/financeiro/CategoriaRanking'
import { Delta } from '../../components/financeiro/Delta'
import { FiltrosBar } from '../../components/financeiro/FiltrosBar'
import { FinanceiroStats } from '../../components/financeiro/FinanceiroStats'
import { variacao } from '../../components/financeiro/metricas'
import { PosVendaChart } from '../../components/financeiro/PosVendaChart'
import { ReceitaChart } from '../../components/financeiro/ReceitaChart'
import { AsyncContent } from '../../components/ui/AsyncContent'
import { PageHeader } from '../../components/ui/PageHeader'
import { useAsync } from '../../hooks/useAsync'
import { financeiroService } from '../../services/financeiroService'
import { formatCurrency } from '../../utils/format'
import { descreverComparacao, descreverPeriodo, gravarFiltros, lerFiltros, paramsDaApi } from '../../utils/filtrosFinanceiro'

export function FinanceiroPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filtros = lerFiltros(searchParams)
  const params = paramsDaApi(filtros)
  const chave = JSON.stringify(params)
  const state = useAsync(() => financeiroService.obterResumo(params), [chave])

  const aplicar = (novos) => setSearchParams(gravarFiltros(novos), { replace: true })
  // Filtro cruzado: clicar num item liga/desliga aquele valor no filtro correspondente
  const alternar = (grupo, valor) =>
    aplicar({ ...filtros, [grupo]: filtros[grupo].includes(valor) ? filtros[grupo].filter((v) => v !== valor) : [...filtros[grupo], valor] })

  const periodo = descreverPeriodo(filtros)
  const comparacao = descreverComparacao(filtros.comparar)

  return (
    <>
      <PageHeader eyebrow="Gestão" title="Financeiro" description="Receita, pós-venda e capital imobilizado em estoque. Combine os filtros para analisar qualquer recorte." />
      <FiltrosBar filtros={filtros} onChange={aplicar} />
      <AsyncContent state={state} isEmpty={() => false} loadingLabel="Atualizando indicadores…">
        {(r) => (
          <section className="fin-grid">
            <FinanceiroStats resumo={r} comparacao={comparacao} />
            <ReceitaChart serie={r.serie} total={r.receita} agrupar={filtros.agrupar} periodo={periodo} comparacao={comparacao} />
            <AcoesRapidas porLoja={r.porLoja} periodo={periodo} />
            <PosVendaChart serie={r.posVenda} taxa={r.taxaPosVenda} agrupar={filtros.agrupar} />
            <CategoriaRanking
              categorias={r.porCategoria}
              receitaTotal={r.receita}
              selecionadas={filtros.categorias}
              onToggle={(c) => alternar('categorias', c)}
            />

            <div className="card fin-span-4">
              <div className="card__header">
                <div>
                  <h2 className="card__title">Desempenho por loja</h2>
                  <p className="card__subtitle">{periodo} · clique numa loja para filtrar</p>
                </div>
              </div>
              <div className="table-wrap">
                <div className="table-scroll">
                  <table className="table">
                    <thead>
                      <tr>
                        <th scope="col">Loja</th>
                        <th scope="col" className="align-right">Receita</th>
                        {comparacao && <th scope="col" className="align-right">Variação</th>}
                        <th scope="col" className="align-right">Pedidos</th>
                        <th scope="col" className="align-right">Ticket médio</th>
                        <th scope="col" className="align-right">Valor em estoque</th>
                      </tr>
                    </thead>
                    <tbody>
                      {r.porLoja.map((l) => {
                        const ativa = filtros.lojas.includes(String(l.loja.id))
                        return (
                          <tr key={l.loja.id} className={`fin-row ${ativa ? 'fin-row--on' : ''}`} onClick={() => alternar('lojas', String(l.loja.id))}>
                            <td>
                              <button type="button" className="fin-row__btn" aria-pressed={ativa}>
                                {l.loja.nome}
                              </button>
                            </td>
                            <td className="align-right">{formatCurrency(l.receita)}</td>
                            {comparacao && (
                              <td className="align-right">
                                <Delta valor={variacao(l.receita, l.receitaAnterior)} />
                              </td>
                            )}
                            <td className="align-right">{l.pedidos}</td>
                            <td className="align-right">{formatCurrency(l.ticketMedio)}</td>
                            <td className="align-right">{formatCurrency(l.valorEstoque)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        )}
      </AsyncContent>
    </>
  )
}
