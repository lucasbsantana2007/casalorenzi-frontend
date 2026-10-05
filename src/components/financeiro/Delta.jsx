import { ArrowDownRight, ArrowUpRight } from 'lucide-react'

// Selo de variação: verde se subiu, vermelho se caiu; some quando não há comparação
export function Delta({ valor }) {
  if (valor === undefined) return null
  if (valor === null) return <span className="fin-delta fin-delta--neutral">sem base</span>
  const positivo = valor >= 0
  const Icon = positivo ? ArrowUpRight : ArrowDownRight
  return (
    <span className={`fin-delta fin-delta--${positivo ? 'up' : 'down'}`}>
      <Icon size={13} aria-hidden="true" />
      {Math.abs(valor * 100).toFixed(1).replace('.', ',')}%
    </span>
  )
}
