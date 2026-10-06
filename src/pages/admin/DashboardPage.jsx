import { ArrowLeftRight, ArrowRight, Boxes, CircleAlert, Headset, Info, ShoppingBag, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MovimentacoesTable } from '../../components/estoque/MovimentacoesTable'
import { AsyncContent } from '../../components/ui/AsyncContent'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatCard } from '../../components/ui/StatCard'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useAsync } from '../../hooks/useAsync'
import { useLojas } from '../../hooks/useCadastros'
import { useSession } from '../../hooks/useSession'
import { dashboardService } from '../../services/dashboardService'
import { formatCurrency, formatNumber, formatRelative } from '../../utils/format'

function saudacao() {
  const hora = new Date().getHours()
  if (hora < 12) return 'Bom dia'
  if (hora < 18) return 'Boa tarde'
  return 'Boa noite'
}

const ALERTA_ICONE = { danger: CircleAlert, warning: TriangleAlert, info: Info }

export function DashboardPage() {
  const { usuario, pode } = useSession()
  const lojas = useLojas()
  // Lojista abre o dashboard já filtrado pela própria loja
  const [lojaId, setLojaId] = useState(usuario.papel === 'LOJISTA' ? String(usuario.lojaId) : '')
  const state = useAsync(() => dashboardService.obterResumo({ lojaId }), [lojaId])
  const nomeLoja = lojas.find((l) => String(l.id) === lojaId)?.nome

  return (
    <>
      <PageHeader
        eyebrow="Visão geral"
        title={`${saudacao()}, ${usuario.nome.split(' ')[0]}`}
        description={nomeLoja ? `Operação da loja ${nomeLoja} hoje.` : 'Resumo consolidado de todas as lojas da rede.'}
        actions={
          <select className="select" value={lojaId} onChange={(e) => setLojaId(e.target.value)} aria-label="Filtrar por loja">
            <option value="">Todas as lojas</option>
            {lojas.map((loja) => (
              <option key={loja.id} value={loja.id}>
                {loja.nome}
              </option>
            ))}
          </select>
        }
      />

      <AsyncContent state={state} isEmpty={() => false} loadingLabel="Carregando indicadores…">
        {(resumo) => <DashboardContent resumo={resumo} pode={pode} />}
      </AsyncContent>
    </>
  )
}

function DashboardContent({ resumo, pode }) {
  const { indicadores: ind, resumoPorLoja, alertas, movimentacoesRecentes, atendimentosRecentes } = resumo
  const totalPecas = resumoPorLoja.reduce((sum, l) => sum + l.pecas, 0) || 1
  const mostrarValor = pode('financeiro')

  return (
    <>
      <section className="kpi-grid" aria-label="Indicadores">
        <StatCard label="Peças em estoque" value={formatNumber(ind.estoqueTotal)} hint={`${ind.variacoesAtivas} SKUs · ${ind.produtosAtivos} produtos ativos`} icon={Boxes} to="/estoque" />
        <StatCard
          label="Estoque baixo"
          value={formatNumber(ind.itensEstoqueBaixo + ind.itensSemEstoque)}
          hint={`${ind.itensSemEstoque} sem estoque · ${ind.itensEstoqueBaixo} abaixo do mínimo`}
          icon={TriangleAlert}
          tone={ind.itensSemEstoque > 0 ? 'danger' : 'warning'}
          to="/estoque?status=ALERTA"
        />
        <StatCard
          label="Atendimentos abertos"
          value={formatNumber(ind.atendimentosAbertos)}
          hint={ind.atendimentosSemResponsavel ? `${ind.atendimentosSemResponsavel} sem responsável` : 'Todos com responsável'}
          icon={Headset}
          tone={ind.atendimentosSemResponsavel ? 'warning' : undefined}
          to={pode('atendimento') ? '/atendimento' : undefined}
        />
        <StatCard
          label="Transferências em trânsito"
          value={formatNumber(ind.transferenciasEmTransito)}
          hint={`${ind.transferenciasPendentes} aguardando envio`}
          icon={ArrowLeftRight}
          to={pode('transferencias') ? '/transferencias' : undefined}
        />
        <StatCard label="Peças vendidas · 7 dias" value={formatNumber(ind.vendas7d)} hint="Vendas registradas no PDV" icon={ShoppingBag} />
      </section>

      <section className="dashboard-grid">
        <div className="card">
          <div className="card__header">
            <div>
              <h2 className="card__title">Resumo por loja</h2>
              <p className="card__subtitle">Distribuição do estoque e pendências de cada unidade</p>
            </div>
          </div>
          <div className="table-wrap">
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Loja</th>
                    <th scope="col">Peças</th>
                    <th scope="col" className="align-right">Itens em alerta</th>
                    <th scope="col" className="align-right">Atendimentos</th>
                    {mostrarValor && <th scope="col" className="align-right">Valor em estoque</th>}
                  </tr>
                </thead>
                <tbody>
                  {resumoPorLoja.map((linha) => (
                    <tr key={linha.loja.id}>
                      <td>
                        <span className="cell-main">{linha.loja.nome}</span>
                        <span className="cell-sub">
                          {linha.loja.cidade} · {linha.loja.uf}
                        </span>
                      </td>
                      <td>
                        <div className="share">
                          <span className="qty">{formatNumber(linha.pecas)}</span>
                          <span className="share__bar" aria-hidden="true">
                            <span style={{ width: `${(linha.pecas / totalPecas) * 100}%` }} />
                          </span>
                        </div>
                      </td>
                      <td className="align-right">
                        <span className={linha.itensBaixos ? 'text-warning qty' : 'qty'}>{linha.itensBaixos}</span>
                      </td>
                      <td className="align-right">{linha.atendimentosAbertos}</td>
                      {mostrarValor && <td className="align-right">{formatCurrency(linha.valorEstoque)}</td>}
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
              <h2 className="card__title">Alertas</h2>
              <p className="card__subtitle">O que precisa de ação agora</p>
            </div>
            <span className="tabs__count">{alertas.length}</span>
          </div>
          {alertas.length === 0 ? (
            <EmptyState title="Nenhum alerta" description="A operação está em dia." />
          ) : (
            <ul className="alert-list">
              {alertas.slice(0, 7).map((alerta) => {
                const Icon = ALERTA_ICONE[alerta.nivel]
                return (
                  <li key={`${alerta.link}-${alerta.titulo}`}>
                    <Link to={alerta.link} className={`alert-item alert-item--${alerta.nivel}`}>
                      <Icon size={16} aria-hidden="true" />
                      <span>
                        <strong>{alerta.titulo}</strong>
                        <span>{alerta.descricao}</span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="card">
          <div className="card__header">
            <div>
              <h2 className="card__title">Movimentações recentes</h2>
              <p className="card__subtitle">Últimos registros de entrada, venda, ajuste e transferência</p>
            </div>
          </div>
          <MovimentacoesTable rows={movimentacoesRecentes} compact />
          <Link to="/estoque/movimentacoes" className="card__footer-link">
            Ver todas as movimentações <ArrowRight size={14} />
          </Link>
        </div>

        <div className="card">
          <div className="card__header">
            <div>
              <h2 className="card__title">Atendimentos em aberto</h2>
              <p className="card__subtitle">Mais recentes primeiro</p>
            </div>
          </div>
          {atendimentosRecentes.length === 0 ? (
            <EmptyState title="Sem atendimentos abertos" />
          ) : (
            <ul className="ticket-list">
              {atendimentosRecentes.map((a) => {
                const conteudo = (
                  <>
                    <div className="ticket-list__top">
                      <span className="mono">{a.protocolo}</span>
                      <StatusBadge type="atendimentoPainel" value={a.status} />
                    </div>
                    <strong>{a.cliente.nome}</strong>
                    <span className="subtle">
                      {a.tipoSolicitacao.titulo} · {formatRelative(a.atualizadoEm)}
                    </span>
                  </>
                )
                return (
                  <li key={a.id}>
                    {pode('atendimento') ? (
                      <Link to={`/atendimento/${a.id}`} className="ticket-list__item">
                        {conteudo}
                      </Link>
                    ) : (
                      <div className="ticket-list__item">{conteudo}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
          {pode('atendimento') && (
            <Link to="/atendimento" className="card__footer-link">
              Abrir central de atendimento <ArrowRight size={14} />
            </Link>
          )}
        </div>
      </section>
    </>
  )
}
