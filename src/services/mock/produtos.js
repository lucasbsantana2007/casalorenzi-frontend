import { byId, db, fail, matches, nextId, respond } from './db'

function produtoView(produto) {
  const variacoes = db.variacoes
    .filter((v) => v.produtoId === produto.id)
    .map((v) => ({
      ...v,
      estoqueTotal: db.estoques.filter((e) => e.variacaoId === v.id).reduce((sum, e) => sum + e.quantidade, 0),
    }))
  return { ...produto, variacoes, estoqueTotal: variacoes.reduce((sum, v) => sum + v.estoqueTotal, 0) }
}

export function listar({ busca, categoria, ativo } = {}) {
  const lista = db.produtos
    .map(produtoView)
    .filter((p) => !categoria || p.categoria === categoria)
    .filter((p) => ativo === undefined || ativo === '' || String(p.ativo) === String(ativo))
    .filter((p) => matches(busca, p.nome, p.categoria, ...p.variacoes.map((v) => v.sku)))
    .sort((a, b) => a.nome.localeCompare(b.nome))
  return respond(lista)
}

export function obter(id) {
  const produto = byId(db.produtos, id)
  return produto ? respond(produtoView(produto)) : fail('Produto não encontrado.', 404)
}

function validar({ nome, categoria, precoBase, variacoes = [] }, produtoId) {
  if (!nome?.trim()) return 'Informe o nome do produto.'
  if (!categoria) return 'Selecione a categoria.'
  if (!(Number(precoBase) > 0)) return 'Informe um preço base válido.'
  const skus = variacoes.map((v) => v.sku.trim().toUpperCase())
  if (new Set(skus).size !== skus.length) return 'Há SKUs repetidos nas variações.'
  const duplicado = db.variacoes.find((v) => v.produtoId !== produtoId && skus.includes(v.sku))
  if (duplicado) return `O SKU ${duplicado.sku} já está em uso.`
  return null
}

// Salva as variações do produto; novas variações recebem estoque zerado em todas as lojas.
function salvarVariacoes(produtoId, variacoes) {
  variacoes.forEach((dados) => {
    const campos = { sku: dados.sku.trim().toUpperCase(), tamanho: dados.tamanho.trim(), cor: dados.cor.trim() }
    const existente = dados.id && byId(db.variacoes, dados.id)
    if (existente) {
      Object.assign(existente, campos)
      return
    }
    const variacao = { id: nextId(db.variacoes), produtoId, ...campos }
    db.variacoes.push(variacao)
    db.lojas.forEach((loja) => {
      db.estoques.push({ id: nextId(db.estoques), lojaId: loja.id, variacaoId: variacao.id, quantidade: 0, quantidadeMin: 2, atualizadoEm: Date.now() })
    })
  })
}

export function criar(dados) {
  const erro = validar(dados)
  if (erro) return fail(erro, 422)
  const produto = { id: nextId(db.produtos), nome: dados.nome.trim(), categoria: dados.categoria, precoBase: Number(dados.precoBase), ativo: dados.ativo ?? true }
  db.produtos.push(produto)
  salvarVariacoes(produto.id, dados.variacoes ?? [])
  return respond(produtoView(produto))
}

export function atualizar(id, dados) {
  const produto = byId(db.produtos, id)
  if (!produto) return fail('Produto não encontrado.', 404)
  const erro = validar(dados, produto.id)
  if (erro) return fail(erro, 422)
  Object.assign(produto, { nome: dados.nome.trim(), categoria: dados.categoria, precoBase: Number(dados.precoBase), ativo: dados.ativo })
  salvarVariacoes(produto.id, dados.variacoes ?? [])
  return respond(produtoView(produto))
}
