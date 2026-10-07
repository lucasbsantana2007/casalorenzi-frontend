import { ATENDIMENTO_ABERTO } from '../../utils/status'
import { anexoView, autorResumo, byId, clientePorId, db, fail, matches, nextId, respond, usuarioResumo, variacaoView } from './db'

function pedidoView(pedido) {
  if (!pedido) return null
  return {
    ...pedido,
    loja: byId(db.lojas, pedido.lojaId),
    itens: pedido.itens.map((item) => ({ ...item, variacao: variacaoView(item.variacaoId) })),
  }
}

// Compras sem conta: o atendimento guarda o contato informado no pedido
function contatoView(contato) {
  return {
    id: null,
    nome: contato.nome,
    email: contato.email,
    telefone: contato.telefone || '—',
    clienteDesde: null,
    totalPedidos: db.pedidos.filter((p) => p.contato?.email === contato.email).length,
    totalAtendimentos: db.atendimentos.filter((a) => a.contato?.email === contato.email).length,
  }
}

function clienteView(id, contato) {
  const cliente = clientePorId(id)
  if (!cliente) return contato ? contatoView(contato) : null
  const { id: clienteId, nome, email, telefone, clienteDesde } = cliente
  return {
    id: clienteId,
    nome,
    email,
    telefone,
    clienteDesde,
    totalPedidos: db.pedidos.filter((p) => p.clienteId === clienteId).length,
    totalAtendimentos: db.atendimentos.filter((a) => a.solicitanteId === clienteId).length,
  }
}

export function atendimentoView(atendimento, { detalhado = false } = {}) {
  const ultima = db.mensagens.filter((m) => m.atendimentoId === atendimento.id).at(-1)
  const view = {
    ...atendimento,
    tipoSolicitacao: byId(db.tiposSolicitacao, atendimento.tipoSolicitacaoId),
    cliente: { id: atendimento.solicitanteId, nome: clientePorId(atendimento.solicitanteId)?.nome ?? atendimento.contato?.nome },
    responsavel: usuarioResumo(atendimento.responsavelId),
    loja: byId(db.lojas, atendimento.lojaId),
    ultimaMensagem: ultima ? { autorTipo: ultima.autorTipo, conteudo: ultima.conteudo, enviadoEm: ultima.enviadoEm } : null,
  }
  if (!detalhado) return view
  return {
    ...view,
    cliente: clienteView(atendimento.solicitanteId, atendimento.contato),
    pedido: pedidoView(byId(db.pedidos, atendimento.pedidoId)),
    mensagens: db.mensagens
      .filter((m) => m.atendimentoId === atendimento.id)
      .map(({ anexoId, ...m }) => ({ ...m, autor: autorResumo(m), anexo: anexoView(anexoId) })),
  }
}

export { pedidoView }

export function listar({ busca, tipoSolicitacaoId, responsavelId, lojaId } = {}) {
  const lista = db.atendimentos
    .map((a) => atendimentoView(a))
    .filter((a) => !tipoSolicitacaoId || a.tipoSolicitacaoId === Number(tipoSolicitacaoId))
    .filter((a) => !lojaId || a.lojaId === Number(lojaId))
    .filter((a) => {
      if (!responsavelId) return true
      if (responsavelId === 'nenhum') return a.responsavelId === null
      return a.responsavelId === Number(responsavelId)
    })
    .filter((a) => matches(busca, a.protocolo, a.cliente.nome, a.tipoSolicitacao.titulo))
    .sort((a, b) => b.atualizadoEm - a.atualizadoEm)
  return respond(lista)
}

export function obter(id) {
  const atendimento = byId(db.atendimentos, id)
  return atendimento ? respond(atendimentoView(atendimento, { detalhado: true })) : fail('Atendimento não encontrado.', 404)
}

function registrarEventoSistema(atendimento, conteudo) {
  db.mensagens.push({ id: nextId(db.mensagens), atendimentoId: atendimento.id, autorId: null, autorTipo: 'SISTEMA', conteudo, enviadoEm: Date.now() })
}

export function atualizar(id, { status, responsavelId }) {
  const atendimento = byId(db.atendimentos, id)
  if (!atendimento) return fail('Atendimento não encontrado.', 404)
  if (responsavelId !== undefined && responsavelId !== atendimento.responsavelId) {
    atendimento.responsavelId = responsavelId
    const nome = usuarioResumo(responsavelId)?.nome
    registrarEventoSistema(atendimento, nome ? `Atendimento atribuído a ${nome}.` : 'Responsável removido.')
  }
  if (status && status !== atendimento.status) {
    atendimento.status = status
    registrarEventoSistema(atendimento, `Status alterado para "${status.replaceAll('_', ' ').toLowerCase()}".`)
  }
  atendimento.atualizadoEm = Date.now()
  return respond(atendimentoView(atendimento, { detalhado: true }))
}

export function enviarMensagem(id, { conteudo, autorId, autorTipo }) {
  const atendimento = byId(db.atendimentos, id)
  if (!atendimento) return fail('Atendimento não encontrado.', 404)
  if (!conteudo?.trim()) return fail('A mensagem não pode ficar vazia.', 422)
  db.mensagens.push({ id: nextId(db.mensagens), atendimentoId: atendimento.id, autorId, autorTipo, conteudo: conteudo.trim(), enviadoEm: Date.now() })

  // Resposta interna move o caso para "aguardando cliente"; resposta do cliente reabre.
  if (autorTipo === 'ATENDENTE' && ATENDIMENTO_ABERTO.includes(atendimento.status)) {
    atendimento.status = 'AGUARDANDO_CLIENTE'
    atendimento.responsavelId ??= autorId
  }
  if (autorTipo === 'CLIENTE' && atendimento.status === 'AGUARDANDO_CLIENTE') atendimento.status = 'EM_ANDAMENTO'
  atendimento.atualizadoEm = Date.now()
  return respond(atendimentoView(atendimento, { detalhado: true }))
}
