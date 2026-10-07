import { createSeed } from '../../data/seed'
import { ApiError } from '../api'
import { statusEstoque } from '../../utils/estoque'

// Banco de demonstração usado enquanto a API real não está disponível.
// Fica salvo no navegador (localStorage): pedidos, PINs, movimentações etc. sobrevivem a recarregar
// a página e valem em todas as abas. Mudar VERSAO descarta os dados salvos e recria a partir do seed.
const CHAVE = 'casalorenzi.demo-db'
const VERSAO = 5

function carregar() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE))
    if (salvo?.versao === VERSAO && salvo.dados) return salvo.dados
  } catch {
    // Sem armazenamento ou dado corrompido: começa do seed
  }
  return createSeed()
}

export const db = carregar()

// Fotos anexadas aos chamados (base64). Coleção separada das mensagens para as listagens não carregarem a imagem.
db.anexos = db.anexos ?? []

// Devolve false quando não conseguiu gravar (ex.: cota do localStorage cheia por causa das fotos)
export function salvar() {
  try {
    localStorage.setItem(CHAVE, JSON.stringify({ versao: VERSAO, dados: db }))
    return true
  } catch {
    // Sem armazenamento (aba anônima, cota cheia): os dados valem só nesta aba
    return false
  }
}

// Outra aba alterou os dados: recarrega para não sobrescrever com uma cópia antiga
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === CHAVE) window.location.reload()
  })
}

const LATENCIA_MS = 220

// Simula a rede: grava as alterações, atrasa e devolve uma cópia profunda,
// para que a interface nunca altere o "banco" por referência.
export function respond(data) {
  salvar()
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(data)), LATENCIA_MS))
}

export function fail(message, status = 400) {
  return new Promise((_, reject) => setTimeout(() => reject(new ApiError(message, { status })), LATENCIA_MS))
}

export function nextId(collection) {
  return collection.reduce((max, item) => Math.max(max, item.id), 0) + 1
}

export const byId = (collection, id) => collection.find((item) => item.id === Number(id))

// Clientes: o id é o CPF (texto com 11 dígitos), por isso não passa pelo Number() do byId
export const clientePorId = (id) => (id ? db.clientes.find((c) => c.id === String(id)) : undefined)
export const clientePorEmail = (email) => db.clientes.find((c) => c.email.toLowerCase() === String(email ?? '').trim().toLowerCase())

export function normalize(text = '') {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

export function matches(search, ...fields) {
  if (!search) return true
  const term = normalize(search.trim())
  return fields.some((field) => normalize(String(field ?? '')).includes(term))
}

export function inPeriod(timestamp, de, ate) {
  if (de && timestamp < new Date(`${de}T00:00:00`).getTime()) return false
  if (ate && timestamp > new Date(`${ate}T23:59:59`).getTime()) return false
  return true
}

// Autor de uma mensagem de atendimento: cliente (pelo CPF) ou alguém da equipe
export function autorResumo({ autorTipo, autorId }) {
  if (autorTipo !== 'CLIENTE') return usuarioResumo(autorId)
  const cliente = clientePorId(autorId)
  return cliente ? { id: cliente.id, nome: cliente.nome, papel: 'CLIENTE' } : null
}

// ---- Projeções: o formato "enriquecido" que esperamos receber da API ----

export function usuarioResumo(id) {
  const usuario = byId(db.usuarios, id)
  return usuario ? { id: usuario.id, nome: usuario.nome, papel: usuario.papel } : null
}

// Anexo de mensagem no formato da API: `url` é um data URL pronto para <img src>
export function anexoView(id) {
  const anexo = id ? byId(db.anexos, id) : null
  return anexo ? { id: anexo.id, nome: anexo.nome, tipo: anexo.tipo, url: `data:${anexo.tipo};base64,${anexo.conteudoBase64}` } : null
}

export function variacaoView(variacaoId) {
  const variacao = byId(db.variacoes, variacaoId)
  const produto = byId(db.produtos, variacao.produtoId)
  return { ...variacao, produto: { id: produto.id, nome: produto.nome, categoria: produto.categoria, precoBase: produto.precoBase, ativo: produto.ativo } }
}

export function estoqueView(estoque) {
  const { produto, ...variacao } = variacaoView(estoque.variacaoId)
  return {
    ...estoque,
    status: statusEstoque(estoque.quantidade, estoque.quantidadeMin),
    loja: byId(db.lojas, estoque.lojaId),
    variacao,
    produto,
  }
}

export function movimentacaoView(mov) {
  const estoque = byId(db.estoques, mov.estoqueId)
  const { produto, ...variacao } = variacaoView(estoque.variacaoId)
  return {
    ...mov,
    loja: byId(db.lojas, estoque.lojaId),
    variacao,
    produto,
    usuario: usuarioResumo(mov.usuarioId),
  }
}

// Registra uma movimentação e atualiza o saldo do estoque correspondente.
export function aplicarMovimentacao({ estoqueId, tipo, quantidade, origem, usuarioId, transferenciaId = null }) {
  const estoque = byId(db.estoques, estoqueId)
  const saldo = estoque.quantidade + quantidade
  if (saldo < 0) throw new ApiError(`Saldo insuficiente: há ${estoque.quantidade} unidade(s) disponível(is).`, { status: 422 })
  const mov = {
    id: nextId(db.movimentacoes),
    estoqueId: estoque.id,
    tipo,
    quantidade,
    origem,
    usuarioId,
    transferenciaId,
    criadoEm: Date.now(),
    saldoResultante: saldo,
  }
  db.movimentacoes.push(mov)
  estoque.quantidade = saldo
  estoque.atualizadoEm = mov.criadoEm
  return mov
}

export function estoquePor(lojaId, variacaoId) {
  return db.estoques.find((e) => e.lojaId === Number(lojaId) && e.variacaoId === Number(variacaoId))
}
