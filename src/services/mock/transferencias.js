import { aplicarMovimentacao, byId, db, estoquePor, fail, matches, nextId, registrarLog, respond, usuarioResumo, variacaoView } from './db'

function transferenciaView(t) {
  const { produto, ...variacao } = variacaoView(t.variacaoId)
  return {
    ...t,
    variacao,
    produto,
    lojaOrigem: byId(db.lojas, t.lojaOrigemId),
    lojaDestino: byId(db.lojas, t.lojaDestinoId),
    solicitante: usuarioResumo(t.solicitanteId),
    responsavel: usuarioResumo(t.responsavelId),
  }
}

export function listar({ status, lojaId, busca } = {}) {
  const lista = db.transferencias
    .map(transferenciaView)
    .filter((t) => !status || t.status === status)
    .filter((t) => !lojaId || t.lojaOrigemId === Number(lojaId) || t.lojaDestinoId === Number(lojaId))
    .filter((t) => matches(busca, t.codigo, t.produto.nome, t.variacao.sku))
    .sort((a, b) => b.criadoEm - a.criadoEm)
  return respond(lista)
}

export function criar({ variacaoId, lojaOrigemId, lojaDestinoId, quantidade, observacao = '', usuarioId }) {
  if (!variacaoId) return fail('Selecione o item a transferir.', 422)
  if (Number(lojaOrigemId) === Number(lojaDestinoId)) return fail('A loja de destino deve ser diferente da origem.', 422)
  const origem = estoquePor(lojaOrigemId, variacaoId)
  if (!origem) return fail('Item não encontrado na loja de origem.', 404)
  if (!(quantidade > 0)) return fail('Informe uma quantidade válida.', 422)
  if (quantidade > origem.quantidade) return fail(`A loja de origem possui apenas ${origem.quantidade} unidade(s).`, 422)

  const id = nextId(db.transferencias)
  const transferencia = {
    id,
    codigo: `TRF-${String(id).padStart(4, '0')}`,
    variacaoId: Number(variacaoId),
    lojaOrigemId: Number(lojaOrigemId),
    lojaDestinoId: Number(lojaDestinoId),
    quantidade,
    status: 'SOLICITADA',
    solicitanteId: usuarioId,
    responsavelId: null,
    criadoEm: Date.now(),
    enviadoEm: null,
    recebidoEm: null,
    observacao,
  }
  db.transferencias.push(transferencia)
  registrarLog({
    area: 'TRANSFERENCIAS',
    acao: 'SOLICITOU',
    descricao: `Solicitou a transferência ${transferencia.codigo}: ${quantidade}× ${byId(db.variacoes, variacaoId).sku} de ${byId(db.lojas, lojaOrigemId).nome} para ${byId(db.lojas, lojaDestinoId).nome}`,
    referencia: { tipo: 'transferencia', id },
  })
  return respond(transferenciaView(transferencia))
}

// Fluxo: SOLICITADA → EM_TRANSITO (baixa na origem) → CONCLUIDA (entrada no destino)
//        SOLICITADA → CANCELADA
export function atualizarStatus(id, { status, usuarioId }) {
  const t = byId(db.transferencias, id)
  if (!t) return fail('Transferência não encontrada.', 404)
  const rota = `${t.codigo} · ${byId(db.lojas, t.lojaOrigemId).nome} → ${byId(db.lojas, t.lojaDestinoId).nome}`

  try {
    if (status === 'EM_TRANSITO' && t.status === 'SOLICITADA') {
      aplicarMovimentacao({ estoqueId: estoquePor(t.lojaOrigemId, t.variacaoId).id, tipo: 'TRANSFERENCIA_SAIDA', quantidade: -t.quantidade, origem: rota, usuarioId, transferenciaId: t.id })
      Object.assign(t, { status, enviadoEm: Date.now(), responsavelId: usuarioId })
    } else if (status === 'CONCLUIDA' && t.status === 'EM_TRANSITO') {
      aplicarMovimentacao({ estoqueId: estoquePor(t.lojaDestinoId, t.variacaoId).id, tipo: 'TRANSFERENCIA_ENTRADA', quantidade: t.quantidade, origem: rota, usuarioId, transferenciaId: t.id })
      Object.assign(t, { status, recebidoEm: Date.now() })
    } else if (status === 'CANCELADA' && t.status === 'SOLICITADA') {
      t.status = status
    } else {
      return fail('Mudança de status não permitida.', 409)
    }
  } catch (error) {
    return fail(error.message, error.status)
  }
  const verbo = { EM_TRANSITO: 'Enviou', CONCLUIDA: 'Recebeu', CANCELADA: 'Cancelou' }[status]
  registrarLog({ area: 'TRANSFERENCIAS', acao: status, descricao: `${verbo} a transferência ${rota}`, referencia: { tipo: 'transferencia', id: t.id } })
  return respond(transferenciaView(t))
}
