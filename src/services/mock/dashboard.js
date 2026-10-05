import { ATENDIMENTO_ABERTO } from '../../utils/status'
import { atendimentoView } from './atendimento'
import { db, estoqueView, movimentacaoView, respond, usuarioResumo } from './db'

const DIA = 86400000

// Consolida os indicadores da tela inicial. Na API real: GET /dashboard/resumo
export function obterResumo({ lojaId } = {}) {
  const daLoja = (id) => !lojaId || id === Number(lojaId)
  const estoques = db.estoques.filter((e) => daLoja(e.lojaId)).map(estoqueView)
  const ativos = estoques.filter((e) => e.produto.ativo)
  const atendimentosAbertos = db.atendimentos.filter((a) => ATENDIMENTO_ABERTO.includes(a.status) && daLoja(a.lojaId))
  const emTransito = db.transferencias.filter((t) => t.status === 'EM_TRANSITO' && (daLoja(t.lojaOrigemId) || daLoja(t.lojaDestinoId)))
  const pendentes = db.transferencias.filter((t) => t.status === 'SOLICITADA' && (daLoja(t.lojaOrigemId) || daLoja(t.lojaDestinoId)))
  const desde7d = Date.now() - 7 * DIA

  const indicadores = {
    estoqueTotal: ativos.reduce((sum, e) => sum + e.quantidade, 0),
    produtosAtivos: db.produtos.filter((p) => p.ativo).length,
    variacoesAtivas: new Set(ativos.map((e) => e.variacaoId)).size,
    itensEstoqueBaixo: ativos.filter((e) => e.status === 'BAIXO').length,
    itensSemEstoque: ativos.filter((e) => e.status === 'SEM_ESTOQUE').length,
    atendimentosAbertos: atendimentosAbertos.length,
    atendimentosSemResponsavel: atendimentosAbertos.filter((a) => !a.responsavelId).length,
    transferenciasEmTransito: emTransito.length,
    transferenciasPendentes: pendentes.length,
    vendas7d: db.movimentacoes
      .filter((m) => m.tipo === 'VENDA' && m.criadoEm >= desde7d)
      .filter((m) => daLoja(db.estoques.find((e) => e.id === m.estoqueId).lojaId))
      .reduce((sum, m) => sum - m.quantidade, 0),
  }

  const resumoPorLoja = db.lojas
    .filter((l) => daLoja(l.id))
    .map((loja) => {
      const itens = ativos.filter((e) => e.lojaId === loja.id)
      return {
        loja,
        pecas: itens.reduce((sum, e) => sum + e.quantidade, 0),
        valorEstoque: itens.reduce((sum, e) => sum + e.quantidade * e.produto.precoBase, 0),
        itensBaixos: itens.filter((e) => e.status !== 'NORMAL').length,
        atendimentosAbertos: atendimentosAbertos.filter((a) => a.lojaId === loja.id).length,
      }
    })

  const alertas = []
  ativos
    .filter((e) => e.status === 'SEM_ESTOQUE')
    .slice(0, 4)
    .forEach((e) =>
      alertas.push({
        nivel: 'danger',
        titulo: `Ruptura: ${e.produto.nome}`,
        descricao: `${e.variacao.sku} · ${e.variacao.cor} ${e.variacao.tamanho} zerado em ${e.loja.nome}`,
        link: `/estoque/${e.id}`,
      }),
    )
  atendimentosAbertos
    .filter((a) => !a.responsavelId)
    .forEach((a) =>
      alertas.push({
        nivel: 'warning',
        titulo: `Atendimento sem responsável · ${a.protocolo}`,
        descricao: `${usuarioResumo(a.solicitanteId)?.nome} aguarda retorno`,
        link: `/atendimento/${a.id}`,
      }),
    )
  emTransito
    .filter((t) => Date.now() - t.enviadoEm > 2 * DIA)
    .forEach((t) =>
      alertas.push({
        nivel: 'info',
        titulo: `Transferência ${t.codigo} em trânsito há mais de 2 dias`,
        descricao: 'Confirme o recebimento na loja de destino',
        link: '/transferencias',
      }),
    )

  const movimentacoesRecentes = db.movimentacoes
    .filter((m) => daLoja(db.estoques.find((e) => e.id === m.estoqueId).lojaId))
    .sort((a, b) => b.criadoEm - a.criadoEm)
    .slice(0, 8)
    .map(movimentacaoView)

  const atendimentosRecentes = atendimentosAbertos
    .sort((a, b) => b.atualizadoEm - a.atualizadoEm)
    .slice(0, 5)
    .map((a) => atendimentoView(a))

  return respond({ indicadores, resumoPorLoja, alertas, movimentacoesRecentes, atendimentosRecentes })
}
