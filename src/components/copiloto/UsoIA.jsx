import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAsync } from '../../hooks/useAsync'
import { copilotoService } from '../../services/copilotoService'
import { formatNumber, formatShortDate } from '../../utils/format'
import { ChartTooltip } from '../financeiro/ChartTooltip'
import { axisProps, CHART } from '../financeiro/chartTheme'
import { AsyncContent } from '../ui/AsyncContent'
import { EmptyState } from '../ui/EmptyState'
import { StatCard } from '../ui/StatCard'

// Só Administrador: uso dos assistentes e custo estimado (tokens informados pela API × tabela de preços).
const dolar = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 4 })

const pct = (parte, total) => (total ? `${Math.round((parte / total) * 100)}%` : '—')

// Qualidade das respostas (decisões 101, 102 e 104): números conferidos antes de sair, falhas e ofertas da equipe,
// e o que os clientes acharam
function QualidadeIA({ qualidade }) {
  const lucia = qualidade.CLIENTE
  const copiloto = qualidade.GERENCIAL
  if (!lucia && !copiloto) {
    return (
      <div className="card">
        <div className="card__body">
          <EmptyState title="Ainda sem respostas para medir" description="A qualidade aparece assim que a Lúcia ou o copiloto responderem com o modelo." />
        </div>
      </div>
    )
  }
  const conferidas = (q) => q.verificacao.CONFERIDA + q.verificacao.REESCRITA + q.verificacao.SUBSTITUIDA
  return (
    <>
      {lucia && (
        <div className="cop-uso__cards">
          <StatCard
            label="Lúcia: respostas conferidas"
            value={formatNumber(conferidas(lucia))}
            hint={`${formatNumber(lucia.comNumeros)} com números · ${formatNumber(lucia.verificacao.REESCRITA)} refeitas · ${formatNumber(lucia.verificacao.SUBSTITUIDA)} trocadas pelo texto das consultas`}
          />
          <StatCard
            label="Lúcia: falhas"
            value={formatNumber(lucia.falhas)}
            hint={`${formatNumber(lucia.ofereceuPessoa)} vezes ofereceu a equipe · ${formatNumber(lucia.sinaisDoCliente.FRUSTRACAO)} clientes frustrados · ${formatNumber(lucia.sinaisDoCliente.REPETICAO)} perguntas repetidas`}
          />
          <StatCard
            label="Clientes: ajudou?"
            value={pct(lucia.avaliacoes.ajudou, lucia.avaliacoes.ajudou + lucia.avaliacoes.naoAjudou)}
            hint={`${formatNumber(lucia.avaliacoes.ajudou)} ajudou · ${formatNumber(lucia.avaliacoes.naoAjudou)} não ajudou`}
          />
          {copiloto && (
            <StatCard
              label="Copiloto: respostas conferidas"
              value={formatNumber(conferidas(copiloto))}
              hint={`${formatNumber(copiloto.verificacao.REESCRITA)} refeitas · ${formatNumber(copiloto.verificacao.SUBSTITUIDA)} trocadas`}
            />
          )}
        </div>
      )}
      {lucia?.comentarios.length > 0 && (
        <div className="card">
          <div className="card__header">
            <div>
              <h2 className="card__title">O que faltou, segundo os clientes</h2>
              <p className="card__subtitle">Os últimos comentários de “não ajudou”, com a pergunta que a Lúcia respondeu</p>
            </div>
          </div>
          <div className="card__body">
            <ul className="cop-uso__comentarios">
              {lucia.comentarios.map((c) => (
                <li key={`${c.em}-${c.pergunta}`}>
                  <strong>{c.comentario}</strong>
                  <span className="cop-sutil">
                    Pergunta: “{c.pergunta}” · {new Date(c.em).toLocaleDateString('pt-BR')}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  )
}

export function UsoIA() {
  const state = useAsync(() => copilotoService.uso(30), [])
  return (
    <AsyncContent state={state} isEmpty={() => false} loadingLabel="Carregando o uso da IA…">
      {(uso) => {
        const total = uso.chamadasAoModelo
        return (
          <div className="cop-uso">
            <div className="cop-uso__cards">
              <StatCard label="Modo atual" value={uso.modoIA === 'LLM' ? 'Modelo de linguagem' : 'Regras (sem chave)'} hint={uso.modoIA === 'LLM' ? uso.modelo : 'Defina ANTHROPIC_API_KEY no backend'} />
              <StatCard label="Chamadas ao modelo (30 dias)" value={formatNumber(total.chamadas)} hint={`${formatNumber(total.erros)} com erro · ${formatNumber(total.recusas)} recusadas`} />
              <StatCard label="Tokens (entrada / saída)" value={`${formatNumber(total.entrada)} / ${formatNumber(total.saida)}`} hint={`${formatNumber(total.cacheLeitura)} lidos do cache`} />
              <StatCard label="Custo estimado (30 dias)" value={dolar.format(total.custo)} hint={`Latência média ${formatNumber(uso.latenciaMediaMs)} ms`} />
            </div>

            <QualidadeIA qualidade={uso.qualidade ?? {}} />

            <div className="card">
              <div className="card__header">
                <div>
                  <h2 className="card__title">Custo estimado por dia</h2>
                  <p className="card__subtitle">Tokens que a API informou × preço de referência do modelo (US$ por milhão de tokens)</p>
                </div>
              </div>
              <div className="card__body">
                {uso.porDia.length === 0 ? (
                  <EmptyState title="Nenhuma chamada ao modelo" description="Sem a chave da API, os assistentes respondem pelas regras, sem custo de modelo." />
                ) : (
                  <div style={{ height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={uso.porDia} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid vertical={false} stroke={CHART.grid} />
                        <XAxis dataKey="dia" tickFormatter={(d) => formatShortDate(`${d}T12:00:00`)} {...axisProps} />
                        <YAxis tickFormatter={(v) => dolar.format(v)} width={72} {...axisProps} />
                        <Tooltip content={<ChartTooltip labelFormat={(d) => formatShortDate(`${d}T12:00:00`)} format={(v) => dolar.format(v)} />} />
                        <Bar dataKey="custo" name="Custo" fill={CHART.primary} radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            <div className="cop-uso__tabelas">
              <div className="card">
                <div className="card__header">
                  <h2 className="card__title">Consultas (ferramentas)</h2>
                </div>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th scope="col">Ferramenta</th>
                        <th scope="col" className="align-right">Chamadas</th>
                        <th scope="col" className="align-right">Recusadas/falhas</th>
                        <th scope="col" className="align-right">ms</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uso.ferramentas.map((f) => (
                        <tr key={f.ferramenta}>
                          <td className="mono">{f.ferramenta}</td>
                          <td className="align-right">{formatNumber(f.chamadas)}</td>
                          <td className="align-right">{formatNumber(f.falhas)}</td>
                          <td className="align-right">{formatNumber(f.duracaoMediaMs)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <p className="cop-sutil">
              Preços de referência (US$ por milhão de tokens, entrada/saída):{' '}
              {Object.entries(uso.precosReferencia)
                .map(([modelo, [entrada, saida]]) => `${modelo} ${entrada}/${saida}`)
                .join(' · ')}
            </p>
          </div>
        )
      }}
    </AsyncContent>
  )
}
