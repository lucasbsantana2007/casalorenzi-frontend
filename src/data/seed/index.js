import { buildAtendimentos, buildPedidos, TIPOS_SOLICITACAO } from './atendimento'
import { CATEGORIAS, LOJAS, PRODUTOS } from './catalogo'
import { buildEstoque, buildVariacoes } from './estoque'
import { CLIENTES, USUARIOS } from './pessoas'

export { CLIENTE_DEMO_ID } from './pessoas'

// Monta o estado inicial completo dos dados de demonstração.
export function createSeed() {
  const variacoes = buildVariacoes()
  const { estoques, movimentacoes, transferencias } = buildEstoque(variacoes)
  const pedidos = buildPedidos(variacoes)
  const { atendimentos, mensagens } = buildAtendimentos(pedidos, variacoes)

  return {
    lojas: LOJAS.map((loja) => ({ ...loja })),
    categorias: [...CATEGORIAS],
    produtos: PRODUTOS.map(({ id, nome, categoria, precoBase, ativo = true }) => ({ id, nome, categoria, precoBase, ativo })),
    variacoes,
    usuarios: [...USUARIOS, ...CLIENTES],
    estoques,
    movimentacoes,
    transferencias,
    pedidos,
    tiposSolicitacao: TIPOS_SOLICITACAO,
    atendimentos,
    mensagens,
  }
}
