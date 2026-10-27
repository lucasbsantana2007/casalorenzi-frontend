// Helo, o programa de pontos do grupo (antes Vulto+; decisões 86 e 87). As mesmas regras de src/entities/fidelidade.py do backend:
// R$ 1 em produtos = 1 ponto na loja física e 2 no site e no app (o frete não conta), bônus da categoria
// antes da compra (Ouro +25%, Vip +50%), resgate de 100 em 100 pontos (100 = R$ 5,00) em compras com
// pelo menos R$ 500 em produtos, validade de 12 meses. Decisões 78 a 80 do registro da união.

export const VALOR_PONTO = 0.05
export const RESGATE_MULTIPLO = 100
export const COMPRA_MINIMA_RESGATE = 500
export const VALIDADE_MESES = 12
export const PONTOS_POR_REAL = { 'Loja física': 1, 'E-commerce': 2, App: 2 }
export const BONUS_CATEGORIA = { Ouro: 0.25, Vip: 0.5 }

// [saldo mínimo, categoria], do maior para o menor (decisão 21)
const FAIXAS = [
  [10000, 'Vip'],
  [5001, 'Ouro'],
  [1501, 'Prata'],
  [1, 'Bronze'],
]

export const categoriaPeloSaldo = (saldo) => FAIXAS.find(([minimo]) => saldo >= minimo)?.[1] ?? null

// Próxima categoria e quantos pontos faltam para ela; null no Vip
export function proximaCategoria(saldo) {
  const proxima = [...FAIXAS].reverse().find(([minimo]) => saldo < minimo)
  return proxima ? { categoria: proxima[1], faltam: proxima[0] - saldo } : null
}

export const valorEmReais = (pontos) => Math.round(pontos * VALOR_PONTO * 100) / 100

// Pontos de uma compra: produtos × pontos por real do canal × (1 + bônus da categoria), arredondado
export function pontosDaCompra(valorProdutos, canal, categoria) {
  const total = valorProdutos * (PONTOS_POR_REAL[canal] ?? 1) * (1 + (BONUS_CATEGORIA[categoria] ?? 0))
  return Math.max(Math.round(total + Number.EPSILON), 0)
}

export const podeResgatar = (valorProdutos) => valorProdutos >= COMPRA_MINIMA_RESGATE

// Mais pontos que dá para usar numa compra: o saldo, sem passar do valor dos produtos, em múltiplos de 100
export function maximoResgatavel(saldo, valorProdutos) {
  const cabeNosProdutos = Math.floor(valorProdutos / VALOR_PONTO + 1e-9)
  return Math.floor(Math.min(saldo, cabeNosProdutos) / RESGATE_MULTIPLO) * RESGATE_MULTIPLO
}

export const formatarPontos = (pontos) => `${Math.abs(pontos).toLocaleString('pt-BR')} ${Math.abs(pontos) === 1 ? 'ponto' : 'pontos'}`

// Rótulos do extrato
export const TIPOS_MOVIMENTO = {
  SALDO_INICIAL: 'Saldo da Vulto',
  CREDITO: 'Compra',
  RESGATE: 'Resgate',
  ESTORNO: 'Estorno',
  AJUSTE: 'Ajuste',
  VENCIMENTO: 'Vencimento',
}
