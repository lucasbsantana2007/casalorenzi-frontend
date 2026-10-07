import { calcularFrete } from '../../utils/frete'
import { formatCurrency } from '../../utils/format'
import { db, exigirAdmin, fail, registrarLog, respond } from './db'

const TIPOS = [
  ['padrao', 'Padrão'],
  ['expresso', 'Expresso'],
]

const semCusto = ({ custo: _custo, ...faixa }) => faixa

// Público (site): valores cobrados e prazos, sem o custo da loja
export function condicoes() {
  const { gratisMinimo, expressoAtivo, regioes } = db.frete
  return respond({
    gratisMinimo,
    expressoAtivo,
    regioes: regioes.map((r) => ({ regiao: r.regiao, nome: r.nome, padrao: semCusto(r.padrao), expresso: semCusto(r.expresso) })),
  })
}

// Administrador: configuração completa, com custo
export function obterConfig() {
  try {
    exigirAdmin()
  } catch (error) {
    return fail(error.message, error.status)
  }
  return respond(db.frete)
}

const numero = (v) => Number(v)
const valido = (v) => Number.isFinite(numero(v)) && numero(v) >= 0

// { gratisMinimo, expressoAtivo, regioes: [{ regiao, padrao: { valor, custo, prazoDias }, expresso: {...} }] }
export function salvarConfig(dados) {
  try {
    exigirAdmin()
  } catch (error) {
    return fail(error.message, error.status)
  }
  if (!valido(dados.gratisMinimo)) return fail('Informe um valor mínimo válido para o frete grátis.', 422)
  for (const r of dados.regioes ?? []) {
    const atual = db.frete.regioes.find((x) => x.regiao === r.regiao)
    if (!atual) return fail('Região de frete desconhecida.', 422)
    for (const [tipo, rotulo] of TIPOS) {
      const f = r[tipo]
      if (!valido(f?.valor) || !valido(f?.custo)) return fail(`${atual.nome} · ${rotulo}: informe valor e custo válidos.`, 422)
      if (!(Number.isInteger(numero(f.prazoDias)) && numero(f.prazoDias) > 0)) return fail(`${atual.nome} · ${rotulo}: o prazo deve ser um número inteiro de dias.`, 422)
    }
  }

  // Registra no log cada valor que mudou, em linguagem de gente
  const alteracoes = []
  const anotar = (campo, de, para, fmt = String) => {
    if (de !== para) alteracoes.push({ campo, de: fmt(de), para: fmt(para) })
  }
  anotar('Frete grátis a partir de', db.frete.gratisMinimo, numero(dados.gratisMinimo), formatCurrency)
  anotar('Expresso disponível', db.frete.expressoAtivo, Boolean(dados.expressoAtivo), (v) => (v ? 'Sim' : 'Não'))
  for (const r of dados.regioes) {
    const atual = db.frete.regioes.find((x) => x.regiao === r.regiao)
    for (const [tipo, rotulo] of TIPOS) {
      anotar(`${atual.nome} · ${rotulo} · valor`, atual[tipo].valor, numero(r[tipo].valor), formatCurrency)
      anotar(`${atual.nome} · ${rotulo} · custo`, atual[tipo].custo, numero(r[tipo].custo), formatCurrency)
      anotar(`${atual.nome} · ${rotulo} · prazo`, atual[tipo].prazoDias, numero(r[tipo].prazoDias), (v) => `${v} dias`)
      Object.assign(atual[tipo], { valor: numero(r[tipo].valor), custo: numero(r[tipo].custo), prazoDias: numero(r[tipo].prazoDias) })
    }
  }
  db.frete.gratisMinimo = numero(dados.gratisMinimo)
  db.frete.expressoAtivo = Boolean(dados.expressoAtivo)
  if (alteracoes.length) {
    registrarLog({ area: 'FRETE', acao: 'EDITOU', descricao: `Alterou a configuração de frete (${alteracoes.length} ${alteracoes.length === 1 ? 'valor' : 'valores'})`, alteracoes })
  }
  return respond(db.frete)
}

// Administrador: simulação para um CEP e um valor de compra, com custo e resultado
export function simular({ cep, subtotal }) {
  try {
    exigirAdmin()
  } catch (error) {
    return fail(error.message, error.status)
  }
  const opcoes = calcularFrete(cep, Number(subtotal) || 0, db.frete).map((o) => ({ ...o, resultado: o.valor - o.custo }))
  return respond(opcoes)
}
