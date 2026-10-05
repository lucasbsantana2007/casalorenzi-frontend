import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCurrency } from '../../utils/format'
import { ChartTooltip } from './ChartTooltip'
import { axisProps, CHART, formatBalde, formatCompactCurrency, ROTULO_AGRUPAMENTO, tituloBalde } from './chartTheme'

export function ReceitaChart({ serie, total, agrupar, periodo, comparacao }) {
  return (
    <div className="card fin-span-3">
      <div className="card__header">
        <div>
          <h2 className="card__title">Receita {ROTULO_AGRUPAMENTO[agrupar]}</h2>
          <p className="card__subtitle">
            {periodo}
            {comparacao && `, ${comparacao}`}
          </p>
        </div>
        <div className="fin-legend">
          <span>
            <i style={{ background: CHART.primary }} /> Atual
          </span>
          {comparacao && (
            <span>
              <i className="fin-legend__dashed" style={{ borderColor: CHART.axis }} /> Comparação
            </span>
          )}
        </div>
      </div>
      <div className="card__body">
        <strong className="fin-chart-total">{formatCurrency(total)}</strong>
        <div className="fin-chart fin-chart--lg">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={serie} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fin-receita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART.primary} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={CHART.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={CHART.grid} />
              <XAxis dataKey="data" tickFormatter={(v) => formatBalde(v, agrupar)} minTickGap={24} {...axisProps} />
              <YAxis tickFormatter={formatCompactCurrency} width={64} {...axisProps} />
              <Tooltip
                cursor={{ stroke: CHART.secondary }}
                content={<ChartTooltip labelFormat={(v) => tituloBalde(v, agrupar)} format={(v) => formatCurrency(v)} />}
              />
              {comparacao && (
                <Line type="monotone" dataKey="receitaAnterior" name="Comparação" stroke={CHART.axis} strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
              )}
              <Area type="monotone" dataKey="receita" name="Receita" stroke={CHART.primary} strokeWidth={2} fill="url(#fin-receita)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
