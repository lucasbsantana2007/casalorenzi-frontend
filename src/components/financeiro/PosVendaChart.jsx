import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartTooltip } from './ChartTooltip'
import { axisProps, CHART, formatBalde, tituloBalde } from './chartTheme'

const formatPercent = (value) => `${(value * 100).toFixed(1).replace('.', ',')}%`

export function PosVendaChart({ serie, taxa, agrupar }) {
  return (
    <div className="card fin-span-2">
      <div className="card__header">
        <div>
          <h2 className="card__title">Trocas e devoluções</h2>
          <p className="card__subtitle">Solicitações sobre os pedidos de cada período</p>
        </div>
        <span className="fin-pill">{formatPercent(taxa)} no período</span>
      </div>
      <div className="card__body">
        <div className="fin-chart">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={serie} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={CHART.grid} />
              <XAxis dataKey="data" tickFormatter={(v) => formatBalde(v, agrupar)} minTickGap={16} {...axisProps} />
              <YAxis yAxisId="qtd" allowDecimals={false} width={28} {...axisProps} />
              <YAxis yAxisId="taxa" orientation="right" tickFormatter={(v) => `${Math.round(v * 100)}%`} width={40} {...axisProps} />
              <Tooltip
                cursor={{ fill: '#f1f3f7' }}
                content={<ChartTooltip labelFormat={(v) => tituloBalde(v, agrupar)} format={(v, key) => (key === 'taxa' ? formatPercent(v) : v)} />}
              />
              <Bar yAxisId="qtd" dataKey="trocas" name="Trocas" stackId="pv" fill={CHART.secondary} maxBarSize={28} />
              <Bar yAxisId="qtd" dataKey="devolucoes" name="Devoluções" stackId="pv" fill={CHART.primary} radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Line yAxisId="taxa" type="linear" dataKey="taxa" name="Taxa" stroke={CHART.accent} strokeWidth={2} dot={{ r: 3, fill: CHART.accent }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
