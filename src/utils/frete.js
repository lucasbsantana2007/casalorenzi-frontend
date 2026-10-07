// Frete por região do CEP. Valores, custos e prazos vêm da configuração (Administração > Frete).

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

// Opções de frete para o CEP e o subtotal, segundo a configuração; [] se o CEP não for atendido.
// O custo só vem junto quando a configuração o tem (painel e servidor; o site recebe sem custo).
export function calcularFrete(cep, subtotal, config) {
  const regiao = config?.regioes.find((r) => r.regiao === regiaoDoCep(cep))
  if (!regiao) return []
  const gratis = subtotal >= config.gratisMinimo
  const opcao = (tipo, label, faixa, valor) => ({ tipo, label, valor, prazoDias: faixa.prazoDias, ...(faixa.custo !== undefined && { custo: faixa.custo }) })
  return [
    opcao('PADRAO', 'Padrão', regiao.padrao, gratis ? 0 : regiao.padrao.valor),
    ...(config.expressoAtivo ? [opcao('EXPRESSO', 'Expresso', regiao.expresso, regiao.expresso.valor)] : []),
  ]
}

// Faixas de CEP (5 primeiros dígitos) dos estados que têm loja. Espelha _FAIXAS_UF do backend.
const FAIXAS_UF = [
  [1000, 19999, 'SP'],
  [20000, 28999, 'RJ'],
  [30000, 39999, 'MG'],
  [70000, 72799, 'DF'],
  [73000, 73699, 'DF'],
  [80000, 87999, 'PR'],
]

// Estado (UF) aproximado pelo CEP, usado para preferir a loja mais próxima na expedição
export function ufDoCep(cep) {
  const prefixo = somenteDigitos(cep).slice(0, 5)
  if (prefixo.length < 5) return null
  const numero = Number(prefixo)
  return FAIXAS_UF.find(([inicio, fim]) => numero >= inicio && numero <= fim)?.[2] ?? null
}
