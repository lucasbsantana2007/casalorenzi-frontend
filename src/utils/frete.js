// Cálculo de frete por região do CEP (tabela de demonstração; na API real vem da transportadora).
export const FRETE_GRATIS_MINIMO = 1000

// Faixas de CEP por região: [início, fim, região]
const FAIXAS = [
  [1000000, 19999999, 'SP'],
  [20000000, 28999999, 'SUDESTE'], // RJ
  [29000000, 39999999, 'SUDESTE'], // ES e MG
  [80000000, 99999999, 'SUL'],
  [70000000, 79999999, 'CENTRO_OESTE'],
  [40000000, 65999999, 'NORDESTE'],
  [66000000, 69999999, 'NORTE'],
]

const TABELA = {
  SP: { padrao: [19.9, 3], expresso: [39.9, 1] },
  SUDESTE: { padrao: [29.9, 5], expresso: [59.9, 2] },
  SUL: { padrao: [34.9, 6], expresso: [64.9, 3] },
  CENTRO_OESTE: { padrao: [39.9, 7], expresso: [74.9, 3] },
  NORDESTE: { padrao: [44.9, 9], expresso: [84.9, 4] },
  NORTE: { padrao: [54.9, 12], expresso: [99.9, 5] },
}

export const somenteDigitos = (valor = '') => String(valor).replace(/\D/g, '')

export function formatarCep(valor = '') {
  const d = somenteDigitos(valor).slice(0, 8)
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}

export function regiaoDoCep(cep) {
  const numero = Number(somenteDigitos(cep))
  if (somenteDigitos(cep).length !== 8) return null
  return FAIXAS.find(([inicio, fim]) => numero >= inicio && numero <= fim)?.[2] ?? null
}

// Opções de frete para o CEP e o subtotal da sacola; [] se o CEP não for atendido
export function calcularFrete(cep, subtotal) {
  const regiao = regiaoDoCep(cep)
  if (!regiao) return []
  const { padrao, expresso } = TABELA[regiao]
  const gratis = subtotal >= FRETE_GRATIS_MINIMO
  return [
    { tipo: 'PADRAO', label: 'Padrão', valor: gratis ? 0 : padrao[0], prazoDias: padrao[1] },
    { tipo: 'EXPRESSO', label: 'Expresso', valor: expresso[0], prazoDias: expresso[1] },
  ]
}

// Estado (UF) aproximado pelo CEP, usado para preferir a loja mais próxima na expedição
export function ufDoCep(cep) {
  const prefixo = Number(somenteDigitos(cep).slice(0, 2))
  if (prefixo >= 1 && prefixo <= 19) return 'SP'
  if (prefixo >= 20 && prefixo <= 28) return 'RJ'
  if (prefixo >= 80 && prefixo <= 87) return 'PR'
  return null
}
