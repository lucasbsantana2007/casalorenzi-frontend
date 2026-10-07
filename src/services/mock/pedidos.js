import { calcularFrete, somenteDigitos, ufDoCep } from '../../utils/frete'
import { ApiError } from '../api'
import { aplicarMovimentacao, byId, clientePorId, db, estoquePor, fail, matches, nextId, registrarLog, respond, salvar, usuarioDaSessao, usuarioResumo, variacaoView } from './db'

const PARCELAS_MAX = 6

db.emails = db.emails ?? []

function proximoNumero() {
  const maior = db.pedidos.reduce((max, p) => Math.max(max, Number(p.numero.replace(/\D/g, ''))), 104820)
  return `CL-${maior + 7}`
}

const estoqueTotal = (variacaoId) => db.estoques.filter((e) => e.variacaoId === variacaoId).reduce((sum, e) => sum + e.quantidade, 0)
const saldoNaLoja = (lojaId, variacaoId) => estoquePor(lojaId, variacaoId)?.quantidade ?? 0

// Escolhe a loja que envia: a que tem todas as peças; empate → mesma UF do CEP; senão a que cobre mais itens
function escolherLojaExpedicao(itens, cep) {
  const uf = ufDoCep(cep)
  const pontuar = (loja) => {
    const cobertos = itens.filter((i) => saldoNaLoja(loja.id, i.variacaoId) >= i.quantidade).length
    return cobertos * 10 + (loja.uf === uf ? 1 : 0)
  }
  // Loja desativada no cadastro não despacha pedidos
  return db.lojas.filter((l) => l.ativa !== false).sort((a, b) => pontuar(b) - pontuar(a))[0]
}

// Cria transferências das outras lojas para a loja de expedição quando falta peça nela
function planejarTransferencias(pedido) {
  pedido.itens.forEach((item) => {
    let falta = item.quantidade - saldoNaLoja(pedido.lojaId, item.variacaoId)
    const doadoras = db.lojas
      .filter((l) => l.id !== pedido.lojaId && l.ativa !== false)
      .map((l) => ({ loja: l, saldo: saldoNaLoja(l.id, item.variacaoId) }))
      .filter((d) => d.saldo > 0)
      .sort((a, b) => b.saldo - a.saldo)
    for (const d of doadoras) {
      if (falta <= 0) break
      const quantidade = Math.min(falta, d.saldo)
      const id = nextId(db.transferencias)
      db.transferencias.push({
        id,
        codigo: `TRF-${String(id).padStart(4, '0')}`,
        variacaoId: item.variacaoId,
        lojaOrigemId: d.loja.id,
        lojaDestinoId: pedido.lojaId,
        quantidade,
        status: 'SOLICITADA',
        solicitanteId: null,
        responsavelId: null,
        criadoEm: Date.now(),
        enviadoEm: null,
        recebidoEm: null,
        observacao: `Automática para o pedido ${pedido.numero}`,
        pedidoId: pedido.id,
      })
      falta -= quantidade
    }
  })
}

const transferenciasDoPedido = (pedidoId) => db.transferencias.filter((t) => t.pedidoId === pedidoId)

function cancelarTransferenciasPendentes(pedidoId) {
  transferenciasDoPedido(pedidoId)
    .filter((t) => t.status === 'SOLICITADA')
    .forEach((t) => {
      t.status = 'CANCELADA'
    })
}

function registrar(pedido, status, usuarioId = null, observacao = '') {
  pedido.historico = [...(pedido.historico ?? []), { status, em: Date.now(), usuario: usuarioResumo(usuarioId), observacao }]
}

export function pedidoAdminView(pedido) {
  const cliente = clientePorId(pedido.clienteId)
  // O custo do frete é do Administrador; Lojista e Operador veem só o que o cliente pagou
  const veCusto = usuarioDaSessao()?.papel === 'ADMINISTRADOR'
  const { custo: _custo, ...freteSemCusto } = pedido.frete ?? {}
  return {
    ...pedido,
    frete: pedido.frete ? (veCusto ? pedido.frete : freteSemCusto) : null,
    contato: pedido.contato ?? (cliente ? { nome: cliente.nome, email: cliente.email, telefone: cliente.telefone } : null),
    loja: byId(db.lojas, pedido.lojaId),
    itens: pedido.itens.map((item) => ({
      ...item,
      variacao: variacaoView(item.variacaoId),
      saldoNaLoja: saldoNaLoja(pedido.lojaId, item.variacaoId),
    })),
    transferencias: transferenciasDoPedido(pedido.id).map((t) => ({
      ...t,
      lojaOrigem: byId(db.lojas, t.lojaOrigemId),
      sku: byId(db.variacoes, t.variacaoId).sku,
    })),
    historico: pedido.historico ?? [{ status: pedido.status, em: pedido.criadoEm, usuario: null, observacao: '' }],
  }
}

// Visão pública (cliente): sem loja de expedição, estoque ou transferências
function pedidoPublicoView(pedido) {
  return {
    numero: pedido.numero,
    status: pedido.status,
    criadoEm: pedido.criadoEm,
    codigoRastreio: pedido.codigoRastreio,
    contato: pedido.contato ? { nome: pedido.contato.nome, email: pedido.contato.email } : null,
    endereco: pedido.endereco ?? null,
    frete: pedido.frete ? { tipo: pedido.frete.tipo, label: pedido.frete.label, valor: pedido.frete.valor, prazoDias: pedido.frete.prazoDias } : null,
    pagamento: pedido.pagamento ?? null,
    subtotal: pedido.subtotal ?? pedido.total,
    total: pedido.total,
    itens: pedido.itens.map((item) => ({ ...item, variacao: variacaoView(item.variacaoId) })),
    historico: (pedido.historico ?? [{ status: pedido.status, em: pedido.criadoEm }]).map(({ status, em }) => ({ status, em })),
  }
}

// ---------- Loja: checkout ----------

// Só cliente com conta compra. { clienteId, endereco: { cep, rua, numero, complemento, bairro, cidade, uf },
//   freteTipo, pagamento: { metodo: 'PIX' | 'CARTAO', parcelas }, itens: [{ variacaoId, quantidade }] }
// clienteId (CPF) só existe no mock: a API real identifica o cliente pelo token da sessão.
export function finalizarCompra(dados) {
  const cliente = clientePorId(dados.clienteId)
  if (!cliente) return fail('Entre ou crie sua conta para finalizar a compra.', 401)
  const e = dados.endereco ?? {}
  if (somenteDigitos(e.cep).length !== 8 || !e.rua?.trim() || !e.numero?.trim() || !e.bairro?.trim() || !e.cidade?.trim() || !e.uf?.trim()) {
    return fail('Preencha o endereço de entrega completo.', 422)
  }
  if (!dados.itens?.length) return fail('Sua sacola está vazia.', 422)

  const itens = []
  for (const { variacaoId, quantidade } of dados.itens) {
    const variacao = byId(db.variacoes, variacaoId)
    const produto = variacao && byId(db.produtos, variacao.produtoId)
    if (!produto?.ativo) return fail('Um dos itens da sacola não está mais disponível.', 422)
    if (estoqueTotal(variacao.id) < quantidade) {
      return fail(`${produto.nome} (${variacao.cor}, ${variacao.tamanho}) esgotou. Ajuste a sacola para continuar.`, 409)
    }
    itens.push({ variacaoId: variacao.id, quantidade, precoUnitario: produto.precoBase })
  }

  const subtotal = itens.reduce((sum, i) => sum + i.precoUnitario * i.quantidade, 0)
  // Com custo: o pedido guarda quanto o frete custou para a loja (só o painel vê)
  const frete = calcularFrete(e.cep, subtotal, db.frete).find((f) => f.tipo === dados.freteTipo)
  if (!frete) return fail('Escolha uma opção de frete para o CEP informado.', 422)
  const metodo = dados.pagamento?.metodo
  if (!['PIX', 'CARTAO'].includes(metodo)) return fail('Escolha a forma de pagamento.', 422)
  const parcelas = metodo === 'CARTAO' ? Math.min(Math.max(Number(dados.pagamento.parcelas) || 1, 1), PARCELAS_MAX) : 1

  const loja = escolherLojaExpedicao(itens, e.cep)
  const agora = Date.now()
  const pedido = {
    id: nextId(db.pedidos),
    numero: proximoNumero(),
    clienteId: cliente.id,
    lojaId: loja.id,
    canal: 'E-commerce',
    status: 'PROCESSANDO',
    criadoEm: agora,
    codigoRastreio: null,
    itens,
    subtotal,
    total: subtotal + frete.valor,
    contato: { nome: cliente.nome, email: cliente.email, telefone: cliente.telefone ?? '' },
    endereco: { ...e, cep: somenteDigitos(e.cep) },
    frete,
    pagamento: { metodo, parcelas, status: 'APROVADO' },
    historico: [],
  }
  registrar(pedido, 'PROCESSANDO', null, `Pagamento aprovado · expedição: ${loja.nome}`)
  db.pedidos.push(pedido)
  planejarTransferencias(pedido)

  // E-mail de confirmação (simulado: fica registrado em db.emails)
  db.emails.push({
    para: cliente.email,
    assunto: `Casa Lorenzi · Pedido ${pedido.numero} confirmado`,
    corpo: `Olá, ${cliente.nome.split(' ')[0]}. Recebemos seu pedido ${pedido.numero}. Para acompanhar a entrega e pedir trocas, devoluções ou ajuda, entre na sua conta com este e-mail e a sua senha.`,
    pedidoId: pedido.id,
    enviadoEm: agora,
  })

  return respond(pedidoPublicoView(pedido))
}

// ---------- Painel: gestão de pedidos ----------

export function listar({ status, lojaId, canal, busca } = {}) {
  const lista = db.pedidos
    .map(pedidoAdminView)
    .filter((p) => !status || p.status === status)
    .filter((p) => !lojaId || p.lojaId === Number(lojaId))
    .filter((p) => !canal || p.canal === canal)
    .filter((p) => matches(busca, p.numero, p.contato?.nome, p.contato?.email))
    .sort((a, b) => b.criadoEm - a.criadoEm)
  return respond(lista)
}

export function obter(id) {
  const pedido = byId(db.pedidos, id)
  return pedido ? respond(pedidoAdminView(pedido)) : fail('Pedido não encontrado.', 404)
}

// { lojaId } troca a loja de expedição | { status: 'ENVIADO', codigoRastreio } | { status: 'ENTREGUE' } | { status: 'CANCELADO' }
export function atualizar(id, { lojaId, status, codigoRastreio, usuarioId }) {
  const pedido = byId(db.pedidos, id)
  if (!pedido) return fail('Pedido não encontrado.', 404)
  let descricao = null

  try {
    if (lojaId !== undefined) {
      if (pedido.status !== 'PROCESSANDO') return fail('A loja só pode ser trocada antes do envio.', 409)
      const loja = byId(db.lojas, lojaId)
      if (!loja) return fail('Loja inválida.', 422)
      if (loja.id !== pedido.lojaId) {
        descricao = `Mudou a expedição do pedido ${pedido.numero} de ${byId(db.lojas, pedido.lojaId).nome} para ${loja.nome}`
        cancelarTransferenciasPendentes(pedido.id)
        pedido.lojaId = loja.id
        planejarTransferencias(pedido)
        registrar(pedido, pedido.status, usuarioId, `Expedição transferida para ${loja.nome}`)
      }
    } else if (status === 'ENVIADO' && pedido.status === 'PROCESSANDO') {
      if (!codigoRastreio?.trim()) return fail('Informe o código de rastreio.', 422)
      const faltando = pedido.itens.filter((i) => saldoNaLoja(pedido.lojaId, i.variacaoId) < i.quantidade)
      if (faltando.length) return fail('Ainda faltam peças na loja de expedição. Conclua as transferências antes de enviar.', 409)
      pedido.itens.forEach((item) =>
        aplicarMovimentacao({
          estoqueId: estoquePor(pedido.lojaId, item.variacaoId).id,
          tipo: 'VENDA',
          quantidade: -item.quantidade,
          origem: `Pedido ${pedido.numero} (e-commerce)`,
          usuarioId,
        }),
      )
      Object.assign(pedido, { status, codigoRastreio: codigoRastreio.trim().toUpperCase() })
      registrar(pedido, status, usuarioId, `Rastreio ${pedido.codigoRastreio}`)
      descricao = `Marcou o pedido ${pedido.numero} como enviado (rastreio ${pedido.codigoRastreio})`
    } else if (status === 'ENTREGUE' && pedido.status === 'ENVIADO') {
      pedido.status = status
      registrar(pedido, status, usuarioId)
      descricao = `Marcou o pedido ${pedido.numero} como entregue`
    } else if (status === 'CANCELADO' && pedido.status === 'PROCESSANDO') {
      cancelarTransferenciasPendentes(pedido.id)
      pedido.status = status
      if (pedido.pagamento) pedido.pagamento = { ...pedido.pagamento, status: 'ESTORNADO' }
      registrar(pedido, status, usuarioId, 'Pagamento estornado')
      descricao = `Cancelou o pedido ${pedido.numero} e estornou o pagamento`
    } else {
      return fail('Mudança de status não permitida.', 409)
    }
  } catch (error) {
    if (error instanceof ApiError) return fail(error.message, error.status)
    throw error
  }
  if (descricao) registrarLog({ area: 'PEDIDOS', acao: 'ATUALIZOU', descricao, referencia: { tipo: 'pedido', id: pedido.id } })
  return respond(pedidoAdminView(pedido))
}

// ---------- Fotos dos chamados (área do cliente) ----------

// Foto opcional do chamado: mesmas regras da API (tipo, 2 MB decodificado, conteúdo de imagem de verdade)
const TIPOS_ANEXO = ['image/jpeg', 'image/png', 'image/webp']
const ANEXO_MAX_BYTES = 2 * 1024 * 1024
const BASE64_VALIDO = /^[A-Za-z0-9+/]+={0,2}$/

function assinaturaConfere(tipo, base64) {
  let inicio
  try {
    inicio = atob(base64.slice(0, 16)) // 12 primeiros bytes
  } catch {
    return false
  }
  if (tipo === 'image/jpeg') return inicio.startsWith('\xFF\xD8\xFF')
  if (tipo === 'image/png') return inicio.startsWith('\x89PNG')
  return inicio.startsWith('RIFF') && inicio.slice(8, 12) === 'WEBP'
}

// → mensagem de erro, ou null se o anexo é válido
function erroDoAnexo(anexo) {
  const { nome, tipo, conteudoBase64 } = anexo ?? {}
  if (!TIPOS_ANEXO.includes(tipo)) return 'A foto deve ser JPG, PNG ou WebP.'
  if (!String(nome ?? '').trim()) return 'Informe o nome do arquivo da foto.'
  if (typeof conteudoBase64 !== 'string' || conteudoBase64.length % 4 !== 0 || !BASE64_VALIDO.test(conteudoBase64)) {
    return 'Não foi possível ler a foto enviada.'
  }
  const padding = conteudoBase64.endsWith('==') ? 2 : conteudoBase64.endsWith('=') ? 1 : 0
  if ((conteudoBase64.length * 3) / 4 - padding > ANEXO_MAX_BYTES) return 'A foto deve ter no máximo 2 MB.'
  if (!assinaturaConfere(tipo, conteudoBase64)) return 'O arquivo enviado não é uma imagem válida.'
  return null
}

// Valida e guarda a foto de um chamado (área do cliente ou Meus pedidos). → id do anexo, ou null sem foto
export function guardarAnexo(anexo) {
  if (!anexo) return null
  const erro = erroDoAnexo(anexo)
  if (erro) throw new ApiError(erro, { status: 422 })
  const id = nextId(db.anexos)
  db.anexos.push({ id, nome: String(anexo.nome).trim().slice(0, 120), tipo: anexo.tipo, conteudoBase64: anexo.conteudoBase64, criadoEm: Date.now() })
  // Só na demonstração: o "banco" vive no localStorage (~5 MB). Sem espaço, recusa em vez de perder o chamado ao recarregar
  if (!salvar()) {
    db.anexos.pop()
    throw new ApiError('Não há espaço no navegador para guardar mais fotos nesta demonstração. Envie a solicitação sem a foto.', { status: 507 })
  }
  return id
}
