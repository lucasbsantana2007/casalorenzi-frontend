import { LOJAS, PRODUTOS } from './catalogo'
import { USUARIOS } from './pessoas'
import { createRandom, daysAgo } from './random'

const HISTORY_DAYS = 75

function codigoCor(cor) {
  return cor
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .slice(0, 3)
    .toUpperCase()
}

export function buildVariacoes() {
  let id = 1
  return PRODUTOS.flatMap((produto) =>
    produto.cores.flatMap((cor) =>
      produto.tamanhos.map((tamanho) => ({
        id: id++,
        produtoId: produto.id,
        sku: `CL-${produto.codigo}-${codigoCor(cor)}-${tamanho === 'Único' ? 'U' : tamanho}`,
        tamanho,
        cor,
      })),
    ),
  )
}

const lojista = (lojaId) => USUARIOS.find((u) => u.papel === 'LOJISTA' && u.lojaId === lojaId).id
const operador = (lojaId) => (lojaId <= 2 ? 6 : 7)
const nomeLoja = (lojaId) => LOJAS.find((l) => l.id === lojaId).nome

// Transferências de exemplo. As concluídas e em trânsito geram as movimentações correspondentes.
function buildTransferencias(rand, variacoes) {
  const roteiro = [
    [38, 'CONCLUIDA'], [34, 'CONCLUIDA'], [31, 'CONCLUIDA'], [27, 'CONCLUIDA'], [24, 'CANCELADA'],
    [21, 'CONCLUIDA'], [18, 'CONCLUIDA'], [15, 'CONCLUIDA'], [12, 'CONCLUIDA'], [9, 'CONCLUIDA'],
    [6, 'CONCLUIDA'], [4, 'EM_TRANSITO'], [3, 'EM_TRANSITO'], [2, 'EM_TRANSITO'], [1, 'SOLICITADA'], [0, 'SOLICITADA'],
  ]
  return roteiro.map(([dias, status], index) => {
    const lojaOrigemId = rand.int(1, 4)
    let lojaDestinoId = rand.int(1, 4)
    if (lojaDestinoId === lojaOrigemId) lojaDestinoId = (lojaOrigemId % 4) + 1
    const criadoEm = daysAgo(dias, rand.int(9, 12), rand.int(0, 59))
    const recebidoEm = status === 'CONCLUIDA' ? criadoEm + rand.int(20, 60) * 3600000 : null
    return {
      id: index + 1,
      codigo: `TRF-${String(index + 1).padStart(4, '0')}`,
      variacaoId: rand.pick(variacoes.filter((v) => v.produtoId !== 13)).id,
      lojaOrigemId,
      lojaDestinoId,
      quantidade: rand.int(1, 3),
      status,
      solicitanteId: rand.pick([1, 2, 3, 4, 5]),
      responsavelId: operador(lojaOrigemId),
      criadoEm,
      enviadoEm: ['EM_TRANSITO', 'CONCLUIDA'].includes(status) ? criadoEm + 2 * 3600000 : null,
      recebidoEm,
      observacao: rand.pick(['Cliente aguardando na loja de destino', 'Reposição de grade', 'Ajuste de mix para vitrine', '']),
    }
  })
}

function eventosAleatorios(rand, loja, produto) {
  const eventos = []
  const intensidadeVenda = { 1: 0.13, 2: 0.11, 3: 0.1, 4: 0.07 }[loja.id] * (produto.ativo === false ? 0.3 : 1)
  for (let dia = HISTORY_DAYS - 1; dia >= 0; dia--) {
    if (rand.chance(intensidadeVenda)) {
      eventos.push({
        tipo: 'VENDA',
        quantidade: -(rand.chance(0.85) ? 1 : 2),
        criadoEm: daysAgo(dia, rand.int(10, 21), rand.int(0, 59)),
        origem: `Venda PDV · cupom ${rand.int(100000, 999999)}`,
        usuarioId: lojista(loja.id),
      })
    }
    if (rand.chance(0.012)) {
      eventos.push({
        tipo: 'DEVOLUCAO',
        quantidade: 1,
        criadoEm: daysAgo(dia, rand.int(11, 19), rand.int(0, 59)),
        origem: 'Devolução de cliente · troca de tamanho',
        usuarioId: lojista(loja.id),
      })
    }
  }
  if (produto.ativo !== false) {
    ;[55, 30, 9].forEach((base) => {
      if (rand.chance(0.6)) {
        eventos.push({
          tipo: 'ENTRADA',
          quantidade: rand.int(3, 6),
          criadoEm: daysAgo(base + rand.int(-4, 4), 8, rand.int(0, 59)),
          origem: `Recebimento do CD · NF ${rand.int(40000, 49999)}`,
          usuarioId: operador(loja.id),
        })
      }
    })
  }
  if (rand.chance(0.15)) {
    eventos.push({
      tipo: 'AJUSTE',
      quantidade: rand.pick([-1, 1, -2]),
      criadoEm: daysAgo(rand.int(3, 40), 18, 30),
      origem: 'Inventário rotativo',
      usuarioId: operador(loja.id),
    })
  }
  return eventos
}

// Constrói estoques e histórico completo de movimentações em ordem cronológica.
// O saldo atual de cada estoque é o resultado das movimentações, então
// "qual era o estoque em uma data" pode ser respondido com exatidão.
export function buildEstoque(variacoes) {
  const rand = createRandom(20260405)
  const transferencias = buildTransferencias(rand, variacoes)
  const estoques = []
  const movimentacoes = []
  let estoqueId = 1
  let movId = 1

  LOJAS.forEach((loja) => {
    variacoes.forEach((variacao) => {
      const produto = PRODUTOS.find((p) => p.id === variacao.produtoId)
      const id = estoqueId++
      const eventos = eventosAleatorios(rand, loja, produto)

      transferencias.forEach((t) => {
        if (t.variacaoId !== variacao.id) return
        const rota = `${t.codigo} · ${nomeLoja(t.lojaOrigemId)} → ${nomeLoja(t.lojaDestinoId)}`
        if (t.lojaOrigemId === loja.id && t.enviadoEm) {
          eventos.push({ tipo: 'TRANSFERENCIA_SAIDA', quantidade: -t.quantidade, criadoEm: t.enviadoEm, origem: rota, usuarioId: t.responsavelId, transferenciaId: t.id })
        }
        if (t.lojaDestinoId === loja.id && t.recebidoEm) {
          eventos.push({ tipo: 'TRANSFERENCIA_ENTRADA', quantidade: t.quantidade, criadoEm: t.recebidoEm, origem: rota, usuarioId: operador(loja.id), transferenciaId: t.id })
        }
      })

      eventos.sort((a, b) => a.criadoEm - b.criadoEm)

      let saldo = produto.ativo === false ? rand.int(2, 5) : rand.int(5, 10)
      const registros = [
        { tipo: 'ENTRADA', quantidade: saldo, criadoEm: daysAgo(HISTORY_DAYS, 8, 0), origem: 'Carga inicial de inventário', usuarioId: 1 },
      ]
      eventos.forEach((evento) => {
        if (saldo + evento.quantidade < 0) {
          if (evento.tipo !== 'TRANSFERENCIA_SAIDA') return
          registros.push({ tipo: 'ENTRADA', quantidade: -evento.quantidade, criadoEm: evento.criadoEm - 3600000, origem: 'Recebimento do CD · reposição urgente', usuarioId: operador(loja.id) })
          saldo -= evento.quantidade
        }
        registros.push(evento)
        saldo += evento.quantidade
      })

      let saldoCorrente = 0
      registros.forEach((registro) => {
        saldoCorrente += registro.quantidade
        movimentacoes.push({ id: movId++, estoqueId: id, ...registro, saldoResultante: saldoCorrente })
      })

      estoques.push({
        id,
        lojaId: loja.id,
        variacaoId: variacao.id,
        quantidade: saldoCorrente,
        quantidadeMin: produto.categoria === 'Acessórios' ? 2 : rand.int(2, 3),
        atualizadoEm: registros[registros.length - 1].criadoEm,
      })
    })
  })

  return { estoques, movimentacoes, transferencias }
}
