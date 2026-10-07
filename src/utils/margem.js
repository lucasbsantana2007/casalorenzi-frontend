// Margem bruta: (preço de venda − custo) ÷ preço. null quando falta o custo ou o preço.
export function margem(preco, custo) {
  const p = Number(preco)
  const c = Number(custo)
  return p > 0 && custo !== '' && custo !== null && custo !== undefined && Number.isFinite(c) ? (p - c) / p : null
}

export const formatarMargem = (m) => (m === null ? '—' : `${Math.round(m * 100)}%`)

// Faixa de margem das variações de um produto: "58%" ou "52% a 60%"
export function faixaDeMargem(preco, variacoes) {
  const margens = variacoes.map((v) => margem(preco, v.precoCusto)).filter((m) => m !== null)
  if (!margens.length) return null
  const min = Math.min(...margens)
  const max = Math.max(...margens)
  return min === max ? formatarMargem(min) : `${formatarMargem(min)} a ${formatarMargem(max)}`
}
