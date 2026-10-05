import { byId, db, respond } from './db'

const DIA = 86400000
// Tipos de solicitação que contam como pós-venda no financeiro
const TIPO_TROCA = 1
const TIPO_DEVOLUCAO = 2

const lista = (valor) => (valor ? String(valor).split(',').filter(Boolean) : [])
const inicioDoDia = (yyyyMmDd) => new Date(`${yyyyMmDd}T00:00`).getTime()
const produtoDaVariacao = (variacaoId) => byId(db.produtos, byId(db.variacoes, variacaoId).produtoId)

// Desloca o intervalo para o período de comparação
function intervaloComparacao(inicio, fim, comparar) {
  if (comparar === 'ano') {
    const menosUmAno = (t) => {
      const d = new Date(t)
      d.setFullYear(d.getFullYear() - 1)
      return d.getTime()
    }
    return { inicio: menosUmAno(inicio), fim: menosUmAno(fim) }
  }
  const duracao = fim - inicio
  return { inicio: inicio - duracao, fim: inicio }
}

// Divide [inicio, fim) em baldes de dia, semana (a partir do início) ou mês de calendário
function baldes(inicio, fim, agrupar) {
  const resultado = []
  let atual = inicio
  while (atual < fim) {
    let proximo
    if (agrupar === 'mes') {
      const d = new Date(atual)
      proximo = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime()
    } else {
      proximo = atual + (agrupar === 'semana' ? 7 : 1) * DIA
    }
    resultado.push({ inicio: atual, fim: Math.min(proximo, fim) })
    atual = proximo
  }
  return resultado
}

// Visão financeira. Na API real: GET /financeiro/resumo?de&ate&comparar&agrupar&lojas&canais&categorias&generos
export function obterResumo(params = {}) {
  const inicio = inicioDoDia(params.de)
  const fim = inicioDoDia(params.ate) + DIA
  const comparar = params.comparar || 'anterior'
  const agrupar = params.agrupar || 'dia'
  const lojas = lista(params.lojas).map(Number)
  const canais = lista(params.canais)
  const categorias = lista(params.categorias)
  const generos = lista(params.generos)
  const filtraProduto = categorias.length || generos.length

  const itemValido = (item) => {
    const produto = produtoDaVariacao(item.variacaoId)
    return (!categorias.length || categorias.includes(produto.categoria)) && (!generos.length || generos.includes(produto.genero))
  }

  // Pedido recortado pelos filtros: com filtro de produto, só os itens que batem entram na receita
  const recortar = (pedido) => {
    if (lojas.length && !lojas.includes(pedido.lojaId)) return null
    if (canais.length && !canais.includes(pedido.canal)) return null
    const itens = filtraProduto ? pedido.itens.filter(itemValido) : pedido.itens
    if (!itens.length) return null
    return { ...pedido, itens, total: itens.reduce((sum, i) => sum + i.precoUnitario * i.quantidade, 0) }
  }

  const recortados = db.pedidos.map(recortar).filter(Boolean)
  const validos = recortados.filter((p) => p.status !== 'CANCELADO')
  const entre = (colecao, a, b) => colecao.filter((p) => p.criadoEm >= a && p.criadoEm < b)
  const soma = (pedidos) => pedidos.reduce((sum, p) => sum + p.total, 0)
  const pecas = (pedidos) => pedidos.reduce((sum, p) => sum + p.itens.reduce((s, i) => s + i.quantidade, 0), 0)

  const atual = entre(validos, inicio, fim)
  const comp = comparar === 'nenhum' ? null : intervaloComparacao(inicio, fim, comparar)
  const anterior = comp ? entre(validos, comp.inicio, comp.fim) : []

  // Estoque é uma foto do momento: respeita loja, categoria e gênero, mas não o período
  const estoques = db.estoques.filter((e) => {
    const produto = produtoDaVariacao(e.variacaoId)
    return (
      (!lojas.length || lojas.includes(e.lojaId)) &&
      (!categorias.length || categorias.includes(produto.categoria)) &&
      (!generos.length || generos.includes(produto.genero))
    )
  })
  const valorDoEstoque = (lista) => lista.reduce((sum, e) => sum + e.quantidade * produtoDaVariacao(e.variacaoId).precoBase, 0)

  const porLoja = db.lojas
    .filter((loja) => !lojas.length || lojas.includes(loja.id))
    .map((loja) => {
      const pedidos = atual.filter((p) => p.lojaId === loja.id)
      return {
        loja,
        receita: soma(pedidos),
        receitaAnterior: comp ? soma(anterior.filter((p) => p.lojaId === loja.id)) : null,
        pedidos: pedidos.length,
        ticketMedio: pedidos.length ? soma(pedidos) / pedidos.length : 0,
        valorEstoque: valorDoEstoque(estoques.filter((e) => e.lojaId === loja.id)),
      }
    })

  const receitaPorCategoria = (pedidos, categoria) =>
    pedidos.reduce(
      (sum, p) =>
        sum +
        p.itens
          .filter((i) => produtoDaVariacao(i.variacaoId).categoria === categoria)
          .reduce((s, i) => s + i.precoUnitario * i.quantidade, 0),
      0,
    )

  const porCategoria = db.categorias
    .filter((c) => !categorias.length || categorias.includes(c))
    .map((categoria) => ({
      categoria,
      receita: receitaPorCategoria(atual, categoria),
      receitaAnterior: comp ? receitaPorCategoria(anterior, categoria) : null,
      valorEstoque: valorDoEstoque(estoques.filter((e) => produtoDaVariacao(e.variacaoId).categoria === categoria)),
    }))
    .sort((a, b) => b.receita - a.receita || b.valorEstoque - a.valorEstoque)

  const periodos = baldes(inicio, fim, agrupar)
  const deslocamento = comp ? comp.inicio - inicio : 0

  const serie = periodos.map((b) => ({
    data: b.inicio,
    receita: soma(entre(validos, b.inicio, b.fim)),
    receitaAnterior: comp ? soma(entre(validos, b.inicio + deslocamento, b.fim + deslocamento)) : null,
  }))

  // Pós-venda: trocas e devoluções; com filtro de canal/produto, só as ligadas a um pedido que bate
  const posVenda = db.atendimentos.filter((a) => {
    if (![TIPO_TROCA, TIPO_DEVOLUCAO].includes(a.tipoSolicitacaoId)) return false
    if (lojas.length && !lojas.includes(a.lojaId)) return false
    if (canais.length || filtraProduto) {
      const pedido = a.pedidoId && byId(db.pedidos, a.pedidoId)
      return Boolean(pedido && recortar(pedido))
    }
    return true
  })
  const posVendaSerie = periodos.map((b) => {
    const naFaixa = (t) => t >= b.inicio && t < b.fim
    const pedidos = recortados.filter((p) => naFaixa(p.criadoEm)).length
    const trocas = posVenda.filter((a) => a.tipoSolicitacaoId === TIPO_TROCA && naFaixa(a.criadoEm)).length
    const devolucoes = posVenda.filter((a) => a.tipoSolicitacaoId === TIPO_DEVOLUCAO && naFaixa(a.criadoEm)).length
    return { data: b.inicio, pedidos, trocas, devolucoes, taxa: pedidos ? (trocas + devolucoes) / pedidos : 0 }
  })
  const pedidosNoPeriodo = entre(recortados, inicio, fim).length
  const totalPosVenda = posVendaSerie.reduce((sum, s) => sum + s.trocas + s.devolucoes, 0)

  return respond({
    receita: soma(atual),
    receitaAnterior: comp ? soma(anterior) : null,
    pedidos: atual.length,
    pedidosAnterior: comp ? anterior.length : null,
    pecas: pecas(atual),
    pecasAnterior: comp ? pecas(anterior) : null,
    cancelados: entre(recortados, inicio, fim).filter((p) => p.status === 'CANCELADO').length,
    valorEstoque: valorDoEstoque(estoques),
    taxaPosVenda: pedidosNoPeriodo ? totalPosVenda / pedidosNoPeriodo : 0,
    porLoja,
    porCategoria,
    serie,
    posVenda: posVendaSerie,
  })
}
