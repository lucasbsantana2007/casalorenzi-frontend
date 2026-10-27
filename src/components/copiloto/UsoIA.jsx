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
