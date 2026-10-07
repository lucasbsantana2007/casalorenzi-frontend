import { formatCurrency } from '../../utils/format'
import { byId, db, exigirAdmin, fail, matches, mudancas, nextId, registrarLog, respond, salvar, usuarioDaSessao } from './db'
import { erroDoAnexo } from './pedidos'

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

// Coleção (página da vitrine) e estação: mesmas regras da API
export const GENEROS = ['Masculino', 'Feminino']
export const ESTACOES = ['Inverno', 'Verão', 'Atemporal']

function validar({ nome, categoria, precoBase, genero, estacao, variacoes = [] }, produtoId) {
  if (!nome?.trim()) return 'Informe o nome do produto.'
  if (!categoria) return 'Selecione a categoria.'
  if (!produtoId && !genero) return 'Selecione a coleção do produto: Masculino ou Feminino.'
  if (genero && !GENEROS.includes(genero)) return 'Coleção inválida. Use Masculino ou Feminino.'
  if (estacao && !ESTACOES.includes(estacao)) return 'Estação inválida. Use Inverno, Verão ou Atemporal.'
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

// Foto do produto. imagem: { nome, tipo, conteudoBase64 } troca a foto; removerImagem: true volta à ilustração.
// Na demonstração vira data URL no "banco" (localStorage, ~5 MB); na API real vai para o S3 e volta como imagemUrl.
// → { erro } se a foto é inválida, ou { alteracao } para o log (null se a foto não mudou)
function aplicarImagem(produto, { imagem, removerImagem }) {
  if (imagem) {
    const erro = erroDoAnexo(imagem)
    if (erro) return { erro }
    const tinhaFoto = Boolean(produto.imagemUrl)
    produto.imagemUrl = `data:${imagem.tipo};base64,${imagem.conteudoBase64}`
    return { alteracao: { campo: 'Foto', de: tinhaFoto ? 'Foto anterior' : 'Ilustração', para: imagem.nome } }
  }
  if (removerImagem && produto.imagemUrl) {
    delete produto.imagemUrl
    return { alteracao: { campo: 'Foto', de: 'Foto enviada', para: 'Ilustração' } }
  }
  return { alteracao: null }
}

// Sem espaço no navegador para a foto (só na demonstração): desfaz e avisa
const semEspaco = () => fail('Não há espaço no navegador para guardar esta foto nesta demonstração. Use uma imagem menor ou remova fotos de outros produtos.', 507)

const ROTULOS_PRODUTO = { nome: 'Nome', categoria: 'Categoria', genero: 'Coleção', estacao: 'Estação', precoBase: 'Preço de venda', ativo: 'Ativo' }
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
    const produto = {
      id: nextId(db.produtos),
      nome: dados.nome.trim(),
      categoria: dados.categoria,
      genero: dados.genero,
      estacao: dados.estacao || 'Atemporal',
      precoBase: Number(dados.precoBase),
      ativo: dados.ativo ?? true,
    }
    const { erro: erroFoto } = aplicarImagem(produto, dados)
    if (erroFoto) return fail(erroFoto, 422)
    db.produtos.push(produto)
    if (produto.imagemUrl && !salvar()) {
      db.produtos.pop()
      return semEspaco()
    }
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
    // Coleção e estação nunca ficam vazias: sem elas o produto sairia da vitrine
    const campos = {
      nome: dados.nome.trim(),
      categoria: dados.categoria,
      genero: dados.genero || produto.genero,
      estacao: dados.estacao || produto.estacao,
      precoBase: Number(dados.precoBase),
      ativo: dados.ativo,
    }
    const alteracoes = mudancas(produto, campos, ROTULOS_PRODUTO, FORMATOS_PRODUTO)
    const nomeAnterior = produto.nome
    const fotoAnterior = produto.imagemUrl
    const { erro: erroFoto, alteracao: alteracaoFoto } = aplicarImagem(produto, dados)
    if (erroFoto) return fail(erroFoto, 422)
    if (alteracaoFoto && produto.imagemUrl && !salvar()) {
      produto.imagemUrl = fotoAnterior
      return semEspaco()
    }
    if (alteracaoFoto) alteracoes.push(alteracaoFoto)
    Object.assign(produto, campos)
    alteracoes.push(...salvarVariacoes(produto.id, dados.variacoes ?? []))
    if (alteracoes.length) {
      registrarLog({ area: 'PRODUTOS', acao: 'EDITOU', descricao: `Editou o produto ${nomeAnterior}`, alteracoes, referencia: { tipo: 'produto', id: produto.id } })
    }
    return respond(produtoView(produto))
  })
}
