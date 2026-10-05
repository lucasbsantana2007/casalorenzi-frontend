import { STATUS } from '../../utils/status'

// Uso: <StatusBadge type="estoque" value="BAIXO" /> ou <StatusBadge tone="info" label="Novo" />
export function StatusBadge({ type, value, tone, label }) {
  const config = type ? STATUS[type]?.[String(value)] : null
  const finalTone = config?.tone ?? tone ?? 'neutral'
  return <span className={`badge badge--${finalTone}`}>{config?.label ?? label ?? value}</span>
}
