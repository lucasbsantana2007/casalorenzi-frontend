import { createSeed } from '../../data/seed'
import { ApiError } from '../api'
import { statusEstoque } from '../../utils/estoque'

// Banco em memória usado enquanto a API real não está disponível.
// Alterações (movimentações, transferências, mensagens...) valem até recarregar a página.
export const db = createSeed()

const LATENCIA_MS = 220

// Simula a rede: atraso e cópia profunda, para que a interface nunca altere o "banco" por referência.
export function respond(data) {
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(data)), LATENCIA_MS))
}

export function fail(message, status = 400) {
  return new Promise((_, reject) => setTimeout(() => reject(new ApiError(message, { status })), LATENCIA_MS))
}

export function nextId(collection) {
  return collection.reduce((max, item) => Math.max(max, item.id), 0) + 1
}

export const byId = (collection, id) => collection.find((item) => item.id === Number(id))

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

// ---- Projeções: o formato "enriquecido" que esperamos receber da API ----

export function usuarioResumo(id) {
  const usuario = byId(db.usuarios, id)
  return usuario ? { id: usuario.id, nome: usuario.nome, papel: usuario.papel } : null
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
