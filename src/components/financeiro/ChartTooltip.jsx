// Tooltip no visual dos cards do painel; format converte cada valor da série
export function ChartTooltip({ active, payload, label, labelFormat, format }) {
  if (!active || !payload?.length) return null
  return (
    <div className="fin-tooltip">
      <span className="fin-tooltip__label">{labelFormat ? labelFormat(label) : label}</span>
      {payload.map((item) => (
        <div key={item.dataKey} className="fin-tooltip__row">
          <span className="fin-tooltip__dot" style={{ background: item.color }} aria-hidden="true" />
          <span>{item.name}</span>
          <strong>{format ? format(item.value, item.dataKey) : item.value}</strong>
        </div>
      ))}
    </div>
  )
}
