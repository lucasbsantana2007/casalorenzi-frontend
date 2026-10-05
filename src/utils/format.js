const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const number = new Intl.NumberFormat('pt-BR')
const date = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
const dateTime = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})
const shortDate = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })

export const formatCurrency = (value) => currency.format(value ?? 0)
export const formatNumber = (value) => number.format(value ?? 0)
export const formatDate = (value) => (value ? date.format(new Date(value)) : '—')
export const formatDateTime = (value) => (value ? dateTime.format(new Date(value)).replace(',', ' ·') : '—')
export const formatShortDate = (value) => (value ? shortDate.format(new Date(value)).replace('.', '') : '—')

export function formatSigned(value) {
  if (value > 0) return `+${formatNumber(value)}`
  return formatNumber(value)
}

export function formatRelative(value) {
  if (!value) return '—'
  const diffMin = Math.round((Date.now() - new Date(value).getTime()) / 60000)
  if (diffMin < 1) return 'agora'
  if (diffMin < 60) return `há ${diffMin} min`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `há ${diffH} h`
  const diffD = Math.round(diffH / 24)
  if (diffD === 1) return 'ontem'
  if (diffD < 30) return `há ${diffD} dias`
  return formatDate(value)
}

// Datas no formato yyyy-mm-dd usadas em <input type="date"> e em query params
export function toInputDate(value) {
  const d = new Date(value)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function daysAgoInput(days) {
  return toInputDate(Date.now() - days * 86400000)
}

export const todayInput = () => daysAgoInput(0)

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}
