import { byId, db, respond } from './db'

const DIA = 86400000

// Visão financeira preliminar. Na API real: GET /financeiro/resumo
export function obterResumo() {
  const desde30d = Date.now() - 30 * DIA
  const pedidos30d = db.pedidos.filter((p) => p.criadoEm >= desde30d && p.status !== 'CANCELADO')

  const porLoja = db.lojas.map((loja) => {
    const pedidos = pedidos30d.filter((p) => p.lojaId === loja.id)
    const valorEstoque = db.estoques
      .filter((e) => e.lojaId === loja.id)
      .reduce((sum, e) => sum + e.quantidade * byId(db.produtos, byId(db.variacoes, e.variacaoId).produtoId).precoBase, 0)
    return {
      loja,
      receita30d: pedidos.reduce((sum, p) => sum + p.total, 0),
      pedidos30d: pedidos.length,
      ticketMedio: pedidos.length ? pedidos.reduce((sum, p) => sum + p.total, 0) / pedidos.length : 0,
      valorEstoque,
    }
  })

  const porCategoria = db.categorias
    .map((categoria) => ({
      categoria,
      valorEstoque: db.estoques.reduce((sum, e) => {
        const produto = byId(db.produtos, byId(db.variacoes, e.variacaoId).produtoId)
        return produto.categoria === categoria ? sum + e.quantidade * produto.precoBase : sum
      }, 0),
    }))
    .sort((a, b) => b.valorEstoque - a.valorEstoque)

  return respond({
    receita30d: porLoja.reduce((sum, l) => sum + l.receita30d, 0),
    pedidos30d: pedidos30d.length,
    valorEstoque: porLoja.reduce((sum, l) => sum + l.valorEstoque, 0),
    porLoja,
    porCategoria,
  })
}
