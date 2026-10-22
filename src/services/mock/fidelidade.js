import {
  BONUS_CATEGORIA,
  categoriaPeloSaldo,
  COMPRA_MINIMA_RESGATE,
  maximoResgatavel,
  podeResgatar,
  pontosDaCompra,
  PONTOS_POR_REAL,
  RESGATE_MULTIPLO,
  VALIDADE_MESES,
  VALOR_PONTO,
  valorEmReais,
} from '../../utils/fidelidade'
import { ApiError } from '../api'
import { byId, db, nextId } from './db'

// Vulto+ nos dados de demonstração: mesmo contrato e mesmas regras do backend (use_cases/fidelidade.py).
// O saldo nunca é editado: cada mudança é um movimento com o saldo resultante, que nunca fica negativo.

const DIA = 86400000

// Clientes de demonstração com pontos da Vulto (CPF → [pontos, dias atrás])
const SALDOS_DEMO = {
  15881399803: [[7200, 70]], // Mariana: Ouro
  69879730917: [[1200, 200]], // Ricardo: Bronze
  11417075350: [[11000, 40]], // Juliana: Vip
}

const venceEm = (quando) => {
  const d = new Date(quando)
  d.setFullYear(d.getFullYear() + VALIDADE_MESES / 12)
  return d.toISOString().slice(0, 10)
}

if (!db.movimentosPontos) {
  db.movimentosPontos = []
  for (const [cpf, entradas] of Object.entries(SALDOS_DEMO)) {
    let saldo = 0
    for (const [pontos, dias] of entradas) {
      saldo += pontos
      const quando = Date.now() - dias * DIA
      db.movimentosPontos.push({
        id: db.movimentosPontos.length + 1,
        clienteId: String(cpf),
        tipo: 'SALDO_INICIAL',
        quantidade: pontos,
        saldo,
        venceEm: venceEm(quando),
        pedidoId: null,
        valorDesconto: null,
        obs: 'Saldo do Vulto+ migrado da Vulto',
        criadoEm: quando,
      })
    }
  }
}

const doCliente = (clienteId) =>
  db.movimentosPontos.filter((m) => m.clienteId === String(clienteId)).sort((a, b) => a.criadoEm - b.criadoEm || a.id - b.id)

export const saldoDe = (clienteId) => doCliente(clienteId).at(-1)?.saldo ?? 0

function lancar(clienteId, tipo, quantidade, { pedido = null, valorDesconto = null, obs = '', quando = Date.now() } = {}) {
  const saldo = saldoDe(clienteId) + quantidade
  if (saldo < 0) throw new ApiError('O saldo de pontos não pode ficar negativo.', { status: 422 })
  const mov = {
    id: nextId(db.movimentosPontos),
    clienteId: String(clienteId),
    tipo,
    quantidade,
    saldo,
    venceEm: quantidade > 0 ? venceEm(quando) : null,
    pedidoId: pedido?.id ?? null,
    valorDesconto,
    obs,
    criadoEm: quando,
  }
  db.movimentosPontos.push(mov)
  return mov
}

// Entradas com o que ainda não foi gasto; as saídas gastam primeiro as mais antigas
function lotesEmAberto(clienteId) {
  let lotes = []
  for (const mov of doCliente(clienteId)) {
    if (mov.quantidade > 0) {
      lotes.push({ venceEm: mov.venceEm ?? venceEm(mov.criadoEm), restante: mov.quantidade })
      continue
    }
    let saida = -mov.quantidade
    for (const lote of [...lotes].sort((a, b) => a.venceEm.localeCompare(b.venceEm))) {
      if (!saida) break
      const usado = Math.min(lote.restante, saida)
      lote.restante -= usado
      saida -= usado
    }
    lotes = lotes.filter((l) => l.restante)
  }
  return lotes
}

// Lança como VENCIMENTO o que sobrou das entradas com mais de 12 meses
function vencer(clienteId) {
  const hoje = new Date().toISOString().slice(0, 10)
  const vencidos = lotesEmAberto(clienteId).filter((l) => l.venceEm < hoje)
  const total = vencidos.reduce((s, l) => s + l.restante, 0)
  if (total) lancar(clienteId, 'VENCIMENTO', -total, { obs: 'Pontos ganhos há mais de 12 meses' })
  return total
}

const ROTULO_BONUS = Object.fromEntries(Object.entries(BONUS_CATEGORIA).map(([c, b]) => [c, Math.round(b * 100)]))

// Mesmo formato de GET /conta/pontos e GET /clientes/{cpf}/pontos
export function resumo(clienteId) {
  vencer(clienteId)
  const saldo = saldoDe(clienteId)
  const categoria = categoriaPeloSaldo(saldo)
  const proximos = {}
  for (const lote of lotesEmAberto(clienteId)) proximos[lote.venceEm] = (proximos[lote.venceEm] ?? 0) + lote.restante
  return {
    saldo,
    valorEmReais: valorEmReais(saldo),
    categoria,
    bonus: ROTULO_BONUS[categoria] ?? 0,
    aVencer: Object.entries(proximos)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(0, 3)
      .map(([data, pontos]) => ({ data, pontos })),
    extrato: doCliente(clienteId)
      .slice()
      .reverse()
      .map((m) => ({
        id: m.id,
        tipo: m.tipo,
        quantidade: m.quantidade,
        saldo: m.saldo,
        venceEm: m.venceEm,
        pedidoNumero: m.pedidoId ? (byId(db.pedidos, m.pedidoId)?.numero ?? null) : null,
        valorDesconto: m.valorDesconto,
        obs: m.obs,
        criadoEm: m.criadoEm,
      })),
    regras: {
      valorPonto: VALOR_PONTO,
      resgateMultiplo: RESGATE_MULTIPLO,
      compraMinimaResgate: COMPRA_MINIMA_RESGATE,
      validadeMeses: VALIDADE_MESES,
      pontosPorReal: PONTOS_POR_REAL,
      bonusCategoria: ROTULO_BONUS,
    },
  }
}

const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// ---------- Checkout ----------

// Desconto do resgate pedido (0 sem pontos). Lança ApiError se o resgate não vale
export function conferirResgate(clienteId, valorProdutos, pontos) {
  if (!pontos) return 0
  if (pontos < 0 || pontos % RESGATE_MULTIPLO) {
    throw new ApiError(`Use os pontos Vulto+ a partir de ${RESGATE_MULTIPLO} e em múltiplos de ${RESGATE_MULTIPLO}.`, { status: 422 })
  }
  if (!podeResgatar(valorProdutos)) {
    throw new ApiError(`Para usar pontos Vulto+, a compra precisa ter pelo menos ${brl(COMPRA_MINIMA_RESGATE)} em produtos (sem o frete).`, { status: 422 })
  }
  vencer(clienteId)
  const saldo = saldoDe(clienteId)
  if (pontos > saldo) throw new ApiError(`Saldo Vulto+ insuficiente: você tem ${saldo} pontos.`, { status: 422 })
  const maximo = maximoResgatavel(saldo, valorProdutos)
  if (pontos > maximo) throw new ApiError(`Nesta compra dá para usar no máximo ${maximo} pontos (o desconto não passa do valor dos produtos).`, { status: 422 })
  return valorEmReais(pontos)
}

export function registrarResgate(clienteId, pedido, pontos) {
  const desconto = valorEmReais(pontos)
  lancar(clienteId, 'RESGATE', -pontos, { pedido, valorDesconto: desconto, obs: `Desconto de ${brl(desconto)} no pedido ${pedido.numero}` })
}

// Pontos da compra aprovada: produtos × canal × bônus da categoria de antes da compra
export function creditarCompra(clienteId, pedido) {
  vencer(clienteId)
  const categoria = categoriaPeloSaldo(saldoDe(clienteId))
  const pontos = pontosDaCompra(pedido.subtotal, pedido.canal, categoria)
  if (pontos <= 0) return 0
  const bonus = ROTULO_BONUS[categoria]
  lancar(clienteId, 'CREDITO', pontos, { pedido, obs: `Compra ${pedido.numero}${bonus ? ` (bônus ${categoria} +${bonus}%)` : ''}` })
  return pontos
}

// ---------- Cancelamento ----------

const totalNoPedido = (pedidoId, tipo) => db.movimentosPontos.filter((m) => m.pedidoId === pedidoId && m.tipo === tipo).reduce((s, m) => s + m.quantidade, 0)

// Tira os pontos ganhos na compra sem deixar o saldo negativo; devolve os usados no resgate
export function cancelarCompra(pedido) {
  if (!pedido.clienteId) return
  const ganhos = totalNoPedido(pedido.id, 'CREDITO') + totalNoPedido(pedido.id, 'ESTORNO')
  const sai = Math.min(ganhos, saldoDe(pedido.clienteId))
  if (sai > 0) lancar(pedido.clienteId, 'ESTORNO', -sai, { pedido, obs: `Pedido ${pedido.numero} cancelado${sai < ganhos ? ` (${ganhos - sai} já tinham sido usados)` : ''}` })
  const usados = -totalNoPedido(pedido.id, 'RESGATE')
  if (usados > 0) lancar(pedido.clienteId, 'AJUSTE', usados, { pedido, obs: `Pedido ${pedido.numero} cancelado: pontos do resgate devolvidos` })
}
