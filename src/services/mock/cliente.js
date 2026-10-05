import { atendimentoView, pedidoView } from './atendimento'
import { byId, db, fail, nextId, normalize, respond } from './db'

export function obterPerfil(clienteId) {
  const cliente = byId(db.usuarios, clienteId)
  return cliente ? respond({ id: cliente.id, nome: cliente.nome, email: cliente.email }) : fail('Cliente não encontrado.', 404)
}

export function listarSolicitacoes(clienteId) {
  return respond(
    db.atendimentos
      .filter((a) => a.solicitanteId === Number(clienteId))
      .map((a) => atendimentoView(a))
      .sort((a, b) => b.criadoEm - a.criadoEm),
  )
}

export function obterSolicitacao(clienteId, id) {
  const atendimento = byId(db.atendimentos, id)
  if (!atendimento || atendimento.solicitanteId !== Number(clienteId)) return fail('Solicitação não encontrada.', 404)
  return respond(atendimentoView(atendimento, { detalhado: true }))
}

export function abrirSolicitacao({ clienteId, tipoSolicitacaoId, pedidoId, descricao }) {
  const tipo = byId(db.tiposSolicitacao, tipoSolicitacaoId)
  if (!tipo) return fail('Selecione o tipo de solicitação.', 422)
  if (tipo.exigeVenda && !pedidoId) return fail('Este tipo de solicitação exige o número do pedido.', 422)
  if (!descricao?.trim() || descricao.trim().length < 10) return fail('Descreva sua solicitação com pelo menos 10 caracteres.', 422)

  const pedido = pedidoId ? byId(db.pedidos, pedidoId) : null
  const id = nextId(db.atendimentos)
  const agora = Date.now()
  const atendimento = {
    id,
    protocolo: `ATD-${String(26000 + id * 37).padStart(6, '0')}`,
    solicitanteId: Number(clienteId),
    responsavelId: null,
    tipoSolicitacaoId: tipo.id,
    status: 'ABERTO',
    pedidoId: pedido?.id ?? null,
    lojaId: pedido?.lojaId ?? byId(db.usuarios, clienteId)?.lojaPreferidaId ?? 1,
    criadoEm: agora,
    atualizadoEm: agora,
  }
  db.atendimentos.push(atendimento)
  db.mensagens.push({ id: nextId(db.mensagens), atendimentoId: id, autorId: Number(clienteId), autorTipo: 'CLIENTE', conteudo: descricao.trim(), enviadoEm: agora })
  return respond(atendimentoView(atendimento, { detalhado: true }))
}

export function listarPedidos(clienteId) {
  return respond(
    db.pedidos
      .filter((p) => p.clienteId === Number(clienteId))
      .map(pedidoView)
      .sort((a, b) => b.criadoEm - a.criadoEm),
  )
}

// Aceita "CL-104820" ou apenas "104820". Só retorna pedidos do próprio cliente.
export function consultarPedido(clienteId, numero) {
  const termo = normalize(numero).replace(/\s/g, '').replace(/^cl-?/, '')
  const pedido = db.pedidos.find((p) => p.clienteId === Number(clienteId) && normalize(p.numero).replace('cl-', '') === termo)
  return pedido ? respond(pedidoView(pedido)) : fail('Não encontramos um pedido com esse número.', 404)
}
