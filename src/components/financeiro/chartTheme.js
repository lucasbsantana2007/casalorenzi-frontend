import { formatShortDate } from '../../utils/format'

// Cores dos gráficos (espelham os tokens de src/styles/base.css; o SVG do recharts não lê var())
export const CHART = {
  primary: '#1d3152',
  secondary: '#c9cfdb',
  accent: '#9a6513',
  grid: '#ece8e1',
  axis: '#97938b',
}

export const axisProps = {
  tickLine: false,
  axisLine: false,
  tick: { fill: CHART.axis, fontSize: 11 },
}

// Valores compactos para eixos: R$ 12 mil
export const formatCompactCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 }).format(value)

const mesAno = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' })

// Rótulo do eixo X conforme o agrupamento escolhido nos filtros
export function formatBalde(value, agrupar) {
  if (agrupar === 'mes') return mesAno.format(new Date(value)).replace('. de ', '/').replace('.', '')
  return formatShortDate(value)
}

export function tituloBalde(value, agrupar) {
  if (agrupar === 'semana') return `Semana de ${formatShortDate(value)}`
  return formatBalde(value, agrupar)
}

export const ROTULO_AGRUPAMENTO = { dia: 'diária', semana: 'semanal', mes: 'mensal' }
