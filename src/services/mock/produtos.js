import { formatCurrency } from '../../utils/format'
import { byId, db, exigirAdmin, fail, matches, mudancas, nextId, registrarLog, respond, usuarioDaSessao } from './db'

// O preço de custo só vai para o Administrador; a vitrine usa a mesma listagem
function produtoView(produto) {
  const veCusto = usuarioDaSessao()?.papel === 'ADMINISTRADOR'
  const variacoes = db.variacoes
    .filter((v) => v.produtoId === produto.id)
    .map(({ precoCusto, ...v }) => ({
      ...v,
      ...(veCusto && { precoCusto }),
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
  const semCusto = variacoes.find((v) => !(Number(v.precoCusto) >= 0) || v.precoCusto === '' || v.precoCusto === null || v.precoCusto === undefined)
  if (semCusto) return `Informe o preço de custo da variação ${semCusto.sku || semCusto.cor}.`
  return null
}

// Salva as variações do produto; novas variações recebem estoque zerado em todas as lojas.
// Devolve as mudanças de custo, para o log.
function salvarVariacoes(produtoId, variacoes) {
  const alteracoes = []
  variacoes.forEach((dados) => {
    const campos = { sku: dados.sku.trim().toUpperCase(), tamanho: dados.tamanho.trim(), cor: dados.cor.trim(), precoCusto: Number(dados.precoCusto) }
    const existente = dados.id && byId(db.variacoes, dados.id)
    if (existente) {
      if (existente.precoCusto !== campos.precoCusto) {
        alteracoes.push({ campo: `Custo ${campos.sku}`, de: existente.precoCusto === undefined ? '—' : formatCurrency(existente.precoCusto), para: formatCurrency(campos.precoCusto) })
      }
      Object.assign(existente, campos)
      return
    }
    alteracoes.push({ campo: `Nova variação ${campos.sku}`, de: '—', para: `${campos.cor} · ${campos.tamanho} · custo ${formatCurrency(campos.precoCusto)}` })
    const variacao = { id: nextId(db.variacoes), produtoId, ...campos }
    db.variacoes.push(variacao)
    db.lojas.forEach((loja) => {
      db.estoques.push({ id: nextId(db.estoques), lojaId: loja.id, variacaoId: variacao.id, quantidade: 0, quantidadeMin: 2, atualizadoEm: Date.now() })
    })
  })
  return alteracoes
}

const ROTULOS_PRODUTO = { nome: 'Nome', categoria: 'Categoria', precoBase: 'Preço de venda', ativo: 'Ativo' }
const FORMATOS_PRODUTO = { precoBase: formatCurrency, ativo: (v) => (v ? 'Sim' : 'Não') }

// Produtos são do Administrador (cadastro, preços e custos)
function comoAdmin(acao) {
  try {
    exigirAdmin()
  } catch (error) {
    return fail(error.message, error.status)
  }
  return acao()
}

export function criar(dados) {
  return comoAdmin(() => {
    const erro = validar(dados)
    if (erro) return fail(erro, 422)
    const produto = { id: nextId(db.produtos), nome: dados.nome.trim(), categoria: dados.categoria, precoBase: Number(dados.precoBase), ativo: dados.ativo ?? true }
    db.produtos.push(produto)
    salvarVariacoes(produto.id, dados.variacoes ?? [])
    registrarLog({ area: 'PRODUTOS', acao: 'CADASTROU', descricao: `Cadastrou o produto ${produto.nome} (${formatCurrency(produto.precoBase)})`, referencia: { tipo: 'produto', id: produto.id } })
    return respond(produtoView(produto))
  })
}

export function atualizar(id, dados) {
  return comoAdmin(() => {
    const produto = byId(db.produtos, id)
    if (!produto) return fail('Produto não encontrado.', 404)
    const erro = validar(dados, produto.id)
    if (erro) return fail(erro, 422)
    const campos = { nome: dados.nome.trim(), categoria: dados.categoria, precoBase: Number(dados.precoBase), ativo: dados.ativo }
    const alteracoes = mudancas(produto, campos, ROTULOS_PRODUTO, FORMATOS_PRODUTO)
    const nomeAnterior = produto.nome
    Object.assign(produto, campos)
    alteracoes.push(...salvarVariacoes(produto.id, dados.variacoes ?? []))
    if (alteracoes.length) {
      registrarLog({ area: 'PRODUTOS', acao: 'EDITOU', descricao: `Editou o produto ${nomeAnterior}`, alteracoes, referencia: { tipo: 'produto', id: produto.id } })
    }
    return respond(produtoView(produto))
  })
}
