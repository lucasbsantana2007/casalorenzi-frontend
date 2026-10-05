// Variação percentual contra o período de comparação; null quando não há base
export function variacao(atual, anterior) {
  if (anterior === null || anterior === undefined) return undefined
  if (!anterior) return null
  return (atual - anterior) / anterior
}
