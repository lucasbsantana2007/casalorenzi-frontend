import { PIN_DEMO } from '../../context/perfisDemo'
import { calcularFrete, somenteDigitos, ufDoCep } from '../../utils/frete'
import { ApiError } from '../api'
import { aplicarMovimentacao, byId, db, estoquePor, fail, matches, nextId, respond, usuarioResumo, variacaoView } from './db'

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PARCELAS_MAX = 6

db.emails = db.emails ?? []

// ---------- PIN de "Meus pedidos" ----------
// Sem login de cliente: e-mail + PIN de 4 dígitos (criado no checkout) dão acesso aos pedidos.
// Na API real o PIN fica com hash (bcrypt) e as tentativas são limitadas no servidor.
const PIN_VALIDO = /^\d{4}$/
const TENTATIVAS_MAX = 5
const BLOQUEIO_MS = 15 * 60 * 1000
const normalizarEmail = (email) => String(email ?? '').trim().toLowerCase()

// email → { pin, erros, bloqueadoAte }; clientes de demonstração já têm PIN
db.pins =
  db.pins ??
  Object.fromEntries(db.usuarios.filter((u) => u.papel === 'CLIENTE').map((u) => [u.email.toLowerCase(), { pin: PIN_DEMO, erros: 0, bloqueadoAte: 0 }]))

const emailDoPedido = (p) => normalizarEmail(p.contato?.email ?? byId(db.usuarios, p.clienteId)?.email)

function verificarPin(email, pin) {
  const registro = db.pins[normalizarEmail(email)]
  if (registro?.bloqueadoAte > Date.now()) {
    throw new ApiError('Muitas tentativas incorretas. Tente de novo em 15 minutos.', { status: 429 })
  }
  if (!registro || registro.pin !== String(pin ?? '')) {
    if (registro && ++registro.erros >= TENTATIVAS_MAX) Object.assign(registro, { erros: 0, bloqueadoAte: Date.now() + BLOQUEIO_MS })
    throw new ApiError('E-mail ou PIN incorretos.', { status: 401 })
  }
  registro.erros = 0
}

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
  return [...db.lojas].sort((a, b) => pontuar(b) - pontuar(a))[0]
}

// Cria transferências das outras lojas para a loja de expedição quando falta peça nela
function planejarTransferencias(pedido) {
  pedido.itens.forEach((item) => {
    let falta = item.quantidade - saldoNaLoja(pedido.lojaId, item.variacaoId)
    const doadoras = db.lojas
      .filter((l) => l.id !== pedido.lojaId)
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
  const cliente = byId(db.usuarios, pedido.clienteId)
  return {
    ...pedido,
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
    frete: pedido.frete ?? null,
    pagamento: pedido.pagamento ?? null,
    subtotal: pedido.subtotal ?? pedido.total,
    total: pedido.total,
    itens: pedido.itens.map((item) => ({ ...item, variacao: variacaoView(item.variacaoId) })),
    historico: (pedido.historico ?? [{ status: pedido.status, em: pedido.criadoEm }]).map(({ status, em }) => ({ status, em })),
  }
}

// ---------- Loja: checkout ----------

// { email, emailConfirmacao, nome, telefone, endereco: { cep, rua, numero, complemento, bairro, cidade, uf },
//   freteTipo, pagamento: { metodo: 'PIX' | 'CARTAO', parcelas }, itens: [{ variacaoId, quantidade }] }
export function finalizarCompra(dados) {
  const email = dados.email?.trim().toLowerCase()
  if (!email || !EMAIL_VALIDO.test(email)) return fail('Informe um e-mail válido.', 422)
  if (email !== dados.emailConfirmacao?.trim().toLowerCase()) return fail('Os e-mails não conferem.', 422)
  if (!dados.nome?.trim()) return fail('Informe o nome completo.', 422)
  if (!PIN_VALIDO.test(String(dados.pin ?? ''))) return fail('O PIN deve ter 4 números.', 422)
  if (dados.pin !== dados.pinConfirmacao) return fail('Os PINs não conferem.', 422)
  const pinExistente = db.pins[email]
  if (pinExistente && pinExistente.pin !== dados.pin) {
    return fail('Este e-mail já tem um PIN. Use o mesmo PIN das suas compras anteriores.', 409)
  }
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
  const frete = calcularFrete(e.cep, subtotal).find((f) => f.tipo === dados.freteTipo)
  if (!frete) return fail('Escolha uma opção de frete para o CEP informado.', 422)
  const metodo = dados.pagamento?.metodo
  if (!['PIX', 'CARTAO'].includes(metodo)) return fail('Escolha a forma de pagamento.', 422)
  const parcelas = metodo === 'CARTAO' ? Math.min(Math.max(Number(dados.pagamento.parcelas) || 1, 1), PARCELAS_MAX) : 1

  // Cliente com conta: liga o pedido a ela pelo e-mail
  const cliente = db.usuarios.find((u) => u.papel === 'CLIENTE' && u.email.toLowerCase() === email)
  const loja = escolherLojaExpedicao(itens, e.cep)
  const agora = Date.now()
  const pedido = {
    id: nextId(db.pedidos),
    numero: proximoNumero(),
    clienteId: cliente?.id ?? null,
    lojaId: loja.id,
    canal: 'E-commerce',
    status: 'PROCESSANDO',
    criadoEm: agora,
    codigoRastreio: null,
    itens,
    subtotal,
    total: subtotal + frete.valor,
    contato: { nome: dados.nome.trim(), email, telefone: dados.telefone?.trim() ?? '' },
    endereco: { ...e, cep: somenteDigitos(e.cep) },
    frete,
    pagamento: { metodo, parcelas, status: 'APROVADO' },
    historico: [],
  }
  if (!pinExistente) db.pins[email] = { pin: dados.pin, erros: 0, bloqueadoAte: 0 }
  registrar(pedido, 'PROCESSANDO', null, `Pagamento aprovado · expedição: ${loja.nome}`)
  db.pedidos.push(pedido)
  planejarTransferencias(pedido)

  // E-mail de confirmação (simulado: fica registrado em db.emails)
  db.emails.push({
    para: email,
    assunto: `Casa Lorenzi · Pedido ${pedido.numero} confirmado`,
    corpo: `Olá, ${pedido.contato.nome.split(' ')[0]}. Recebemos seu pedido ${pedido.numero}. Para acompanhar a entrega e pedir trocas, devoluções ou ajuda, acesse Meus pedidos com este e-mail e o PIN que você criou.`,
    pedidoId: pedido.id,
    enviadoEm: agora,
  })

  return respond(pedidoPublicoView(pedido))
}

// "Meus pedidos": todos os pedidos do e-mail, liberados pelo PIN
export function listarMeusPedidos({ email, pin }) {
  try {
    verificarPin(email, pin)
  } catch (error) {
    return fail(error.message, error.status)
  }
  const lista = db.pedidos
    .filter((p) => emailDoPedido(p) === normalizarEmail(email))
    .sort((a, b) => b.criadoEm - a.criadoEm)
    .map(pedidoPublicoView)
  return respond(lista)
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

  try {
    if (lojaId !== undefined) {
      if (pedido.status !== 'PROCESSANDO') return fail('A loja só pode ser trocada antes do envio.', 409)
      const loja = byId(db.lojas, lojaId)
      if (!loja) return fail('Loja inválida.', 422)
      if (loja.id !== pedido.lojaId) {
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
    } else if (status === 'ENTREGUE' && pedido.status === 'ENVIADO') {
      pedido.status = status
      registrar(pedido, status, usuarioId)
    } else if (status === 'CANCELADO' && pedido.status === 'PROCESSANDO') {
      cancelarTransferenciasPendentes(pedido.id)
      pedido.status = status
      if (pedido.pagamento) pedido.pagamento = { ...pedido.pagamento, status: 'ESTORNADO' }
      registrar(pedido, status, usuarioId, 'Pagamento estornado')
    } else {
      return fail('Mudança de status não permitida.', 409)
    }
  } catch (error) {
    if (error instanceof ApiError) return fail(error.message, error.status)
    throw error
  }
  return respond(pedidoAdminView(pedido))
}

// ---------- Loja: pós-venda em "Meus pedidos" ----------

// { numero, email, pin, tipoSolicitacaoId, descricao } — troca, devolução, reclamação etc. sem conta
export function abrirSolicitacao({ numero, email, pin, tipoSolicitacaoId, descricao }) {
  try {
    verificarPin(email, pin)
  } catch (error) {
    return fail(error.message, error.status)
  }
  const pedido = db.pedidos.find((p) => p.numero === numero && emailDoPedido(p) === normalizarEmail(email))
  if (!pedido) return fail('Pedido não encontrado.', 404)
  const contato = pedido.contato ?? byId(db.usuarios, pedido.clienteId)
  const tipo = byId(db.tiposSolicitacao, tipoSolicitacaoId)
  if (!tipo) return fail('Selecione o tipo de solicitação.', 422)
  if (!descricao?.trim() || descricao.trim().length < 10) return fail('Descreva sua solicitação com pelo menos 10 caracteres.', 422)

  const id = nextId(db.atendimentos)
  const agora = Date.now()
  const atendimento = {
    id,
    protocolo: `ATD-${String(26000 + id * 37).padStart(6, '0')}`,
    solicitanteId: pedido.clienteId ?? null,
    contato: { nome: contato.nome, email: contato.email, telefone: contato.telefone ?? '' },
    responsavelId: null,
    tipoSolicitacaoId: tipo.id,
    status: 'ABERTO',
    pedidoId: pedido.id,
    lojaId: pedido.lojaId,
    criadoEm: agora,
    atualizadoEm: agora,
  }
  db.atendimentos.push(atendimento)
  db.mensagens.push({ id: nextId(db.mensagens), atendimentoId: id, autorId: pedido.clienteId ?? null, autorTipo: 'CLIENTE', conteudo: descricao.trim(), enviadoEm: agora })
  db.emails.push({
    para: contato.email,
    assunto: `Casa Lorenzi · Solicitação ${atendimento.protocolo} recebida`,
    corpo: `Recebemos sua solicitação sobre o pedido ${pedido.numero}. Protocolo: ${atendimento.protocolo}.`,
    pedidoId: pedido.id,
    enviadoEm: agora,
  })
  return respond({ id: atendimento.id, protocolo: atendimento.protocolo, tipo: tipo.titulo })
}

// ---------- Loja: esqueci o PIN ----------

const VALIDADE_LINK_MS = 30 * 60 * 1000
db.resetsPin = db.resetsPin ?? {} // token → { email, expiraEm }

// Envia o e-mail com o link de confirmação. A resposta é sempre a mesma,
// exista ou não o e-mail, para não revelar quem já comprou na loja.
export function solicitarNovoPin({ email }) {
  const alvo = normalizarEmail(email)
  if (!EMAIL_VALIDO.test(alvo)) return fail('Informe um e-mail válido.', 422)
  const temPedidos = Boolean(db.pins[alvo]) || db.pedidos.some((p) => emailDoPedido(p) === alvo)
  let linkDemo = null
  if (temPedidos) {
    const token = crypto.randomUUID()
    db.resetsPin[token] = { email: alvo, expiraEm: Date.now() + VALIDADE_LINK_MS }
    linkDemo = `/meus-pedidos/novo-pin?token=${token}`
    db.emails.push({
      para: alvo,
      assunto: 'Casa Lorenzi · Crie um novo PIN',
      corpo: `Recebemos um pedido para trocar o PIN de Meus pedidos. Para criar um novo, acesse: ${linkDemo}. O link vale por 30 minutos. Se não foi você, ignore este e-mail.`,
      enviadoEm: Date.now(),
    })
  }
  // linkDemo só existe na demonstração (simula abrir o e-mail); a API real não devolve o link
  return respond({ enviado: true, linkDemo })
}

// { token, pin, pinConfirmacao } → define o novo PIN e invalida o link
export function redefinirPin({ token, pin, pinConfirmacao }) {
  const pedido = db.resetsPin[token]
  if (!pedido || pedido.expiraEm < Date.now()) {
    delete db.resetsPin[token]
    return fail('Este link expirou ou já foi usado. Peça um novo em Meus pedidos.', 410)
  }
  if (!PIN_VALIDO.test(String(pin ?? ''))) return fail('O PIN deve ter 4 números.', 422)
  if (pin !== pinConfirmacao) return fail('Os PINs não conferem.', 422)
  db.pins[pedido.email] = { pin, erros: 0, bloqueadoAte: 0 }
  delete db.resetsPin[token]
  return respond({ email: pedido.email })
}

// ---------- Loja: minhas solicitações ----------

const doEmail = (atendimento, email) =>
  normalizarEmail(atendimento.contato?.email ?? byId(db.usuarios, atendimento.solicitanteId)?.email) === email

// Visão do cliente: sem dados internos (responsável, loja); da equipe aparece só o primeiro nome
function solicitacaoPublicaView(a) {
  return {
    id: a.id,
    protocolo: a.protocolo,
    status: a.status,
    tipo: byId(db.tiposSolicitacao, a.tipoSolicitacaoId)?.titulo,
    pedidoNumero: byId(db.pedidos, a.pedidoId)?.numero ?? null,
    criadoEm: a.criadoEm,
    atualizadoEm: a.atualizadoEm,
    mensagens: db.mensagens
      .filter((m) => m.atendimentoId === a.id)
      .map((m) => ({
        id: m.id,
        autorTipo: m.autorTipo,
        conteudo: m.conteudo,
        enviadoEm: m.enviadoEm,
        autor: m.autorTipo === 'ATENDENTE' ? { nome: usuarioResumo(m.autorId)?.nome.split(' ')[0] ?? 'Equipe' } : null,
      })),
  }
}

// { email, pin } → chamados abertos com este e-mail (mais recentes primeiro)
export function listarMinhasSolicitacoes({ email, pin }) {
  try {
    verificarPin(email, pin)
  } catch (error) {
    return fail(error.message, error.status)
  }
  const alvo = normalizarEmail(email)
  return respond(
    db.atendimentos
      .filter((a) => doEmail(a, alvo))
      .sort((a, b) => b.atualizadoEm - a.atualizadoEm)
      .map(solicitacaoPublicaView),
  )
}

// { email, pin, id, conteudo } → cliente responde no chamado; se a equipe aguardava retorno, o caso volta para "em andamento"
export function responderSolicitacao({ email, pin, id, conteudo }) {
  try {
    verificarPin(email, pin)
  } catch (error) {
    return fail(error.message, error.status)
  }
  const atendimento = byId(db.atendimentos, id)
  if (!atendimento || !doEmail(atendimento, normalizarEmail(email))) return fail('Solicitação não encontrada.', 404)
  if (atendimento.status === 'CONCLUIDO') return fail('Esta solicitação foi encerrada. Abra um novo chamado se precisar.', 409)
  if (!conteudo?.trim()) return fail('A mensagem não pode ficar vazia.', 422)
  db.mensagens.push({
    id: nextId(db.mensagens),
    atendimentoId: atendimento.id,
    autorId: atendimento.solicitanteId,
    autorTipo: 'CLIENTE',
    conteudo: conteudo.trim(),
    enviadoEm: Date.now(),
  })
  if (atendimento.status === 'AGUARDANDO_CLIENTE') atendimento.status = 'EM_ANDAMENTO'
  atendimento.atualizadoEm = Date.now()
  return respond(solicitacaoPublicaView(atendimento))
}
