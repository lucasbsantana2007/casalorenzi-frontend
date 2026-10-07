import { ApiError } from '../api'
import { aplicarMovimentacao, byId, db, estoqueView, fail, inPeriod, matches, movimentacaoView, produtoRemovido, registrarLog, respond } from './db'

// incluirRemovidos: só para reconstruir o passado (posição em data)
function filtrarEstoques({ busca, lojaId, categoria, status, variacaoId, incluirRemovidos = false } = {}) {
  return db.estoques
    .filter((e) => incluirRemovidos || !produtoRemovido(e.variacaoId))
    .map(estoqueView)
    .filter((e) => !lojaId || e.lojaId === Number(lojaId))
    .filter((e) => !variacaoId || e.variacaoId === Number(variacaoId))
    .filter((e) => !categoria || e.produto.categoria === categoria)
    // ALERTA agrupa estoque baixo e sem estoque
    .filter((e) => !status || (status === 'ALERTA' ? e.status !== 'NORMAL' : e.status === status))
    .filter((e) => matches(busca, e.produto.nome, e.variacao.sku, e.variacao.cor))
}

export function listar(filtros) {
  const ordemStatus = { SEM_ESTOQUE: 0, BAIXO: 1, NORMAL: 2 }
  return respond(
    filtrarEstoques(filtros).sort(
      (a, b) => ordemStatus[a.status] - ordemStatus[b.status] || a.produto.nome.localeCompare(b.produto.nome) || a.lojaId - b.lojaId,
    ),
  )
}

export function obter(id) {
  const estoque = byId(db.estoques, id)
  return estoque ? respond(estoqueView(estoque)) : fail('Item de estoque não encontrado.', 404)
}

export function listarMovimentacoes({ estoqueId, lojaId, tipo, de, ate, busca } = {}) {
  const lista = db.movimentacoes
    .filter((m) => !estoqueId || m.estoqueId === Number(estoqueId))
    .filter((m) => !tipo || m.tipo === tipo)
    .filter((m) => inPeriod(m.criadoEm, de, ate))
    .map(movimentacaoView)
    .filter((m) => !lojaId || m.loja.id === Number(lojaId))
    .filter((m) => matches(busca, m.produto.nome, m.variacao.sku, m.origem))
    .sort((a, b) => b.criadoEm - a.criadoEm)
  return respond(lista)
}

// Reconstrói o saldo de cada item ao final do dia informado, a partir do histórico.
export function posicaoEmData({ data, lojaId, busca } = {}) {
  if (!data) return fail('Informe a data de referência.', 422)
  const limite = new Date(`${data}T23:59:59`).getTime()
  const saldos = new Map()
  db.movimentacoes.forEach((m) => {
    if (m.criadoEm <= limite) saldos.set(m.estoqueId, (saldos.get(m.estoqueId) ?? 0) + m.quantidade)
  })
  const itens = filtrarEstoques({ lojaId, busca, incluirRemovidos: true })
    .map((e) => ({ ...e, quantidadeNaData: saldos.get(e.id) ?? 0 }))
    .sort((a, b) => Number(b.produto.ativo) - Number(a.produto.ativo) || a.produto.nome.localeCompare(b.produto.nome) || a.lojaId - b.lojaId)
  return respond({ data, itens })
}

export function registrarMovimentacao({ estoqueId, tipo, quantidade, origem, usuarioId }) {
  const estoque = byId(db.estoques, estoqueId)
  if (!estoque) return fail('Item de estoque não encontrado.', 404)
  if (produtoRemovido(estoque.variacaoId)) return fail('Este produto foi removido do catálogo.', 409)
  if (!Number.isInteger(quantidade) || quantidade === 0) return fail('Informe uma quantidade válida.', 422)
  try {
    const mov = aplicarMovimentacao({ estoqueId: Number(estoqueId), tipo, quantidade, origem, usuarioId })
    const view = movimentacaoView(mov)
    registrarLog({
      area: 'ESTOQUE',
      acao: tipo,
      descricao: `Registrou ${quantidade > 0 ? '+' : ''}${quantidade} un. (${tipo.toLowerCase()}) de ${view.variacao.sku} na loja ${view.loja.nome}`,
      referencia: { tipo: 'estoque', id: Number(estoqueId) },
    })
    return respond(view)
  } catch (error) {
    if (error instanceof ApiError) return fail(error.message, error.status)
    throw error
  }
}
