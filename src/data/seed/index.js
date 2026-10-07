import { buildAtendimentos, buildPedidos, TIPOS_SOLICITACAO } from './atendimento'
import { CATEGORIAS, LOJAS, PRODUTOS } from './catalogo'
import { DETALHES_PRODUTOS } from './detalhesProdutos'
import { FRETE_INICIAL } from './frete'
import { buildEstoque, buildVariacoes } from './estoque'
import { CLIENTES, USUARIOS } from './pessoas'

// Monta o estado inicial completo dos dados de demonstração.
export function createSeed() {
  const variacoes = buildVariacoes()
  const { estoques, movimentacoes, transferencias } = buildEstoque(variacoes)
  const pedidos = buildPedidos(variacoes)
  const { atendimentos, mensagens } = buildAtendimentos(pedidos, variacoes)

  return {
    lojas: LOJAS.map((loja) => ({ ...loja, horarios: [...loja.horarios] })),
    categorias: [...CATEGORIAS],
    produtos: PRODUTOS.map(({ id, nome, categoria, precoBase, genero, estacao, ativo = true }) => ({
      id,
      nome,
      categoria,
      precoBase,
      genero,
      estacao,
      ativo,
      ...DETALHES_PRODUTOS[id],
    })),
    // Preço de custo de demonstração: 40% do preço de venda
    variacoes: variacoes.map((v) => ({ ...v, precoCusto: Math.round(PRODUTOS.find((p) => p.id === v.produtoId).precoBase * 0.4 * 100) / 100 })),
    frete: structuredClone(FRETE_INICIAL),
    // Funcionários (equipe) e clientes ficam em tabelas separadas; o id do cliente é o CPF.
    // senhaHash null: cliente de demonstração, entra com a senha de demonstração
    usuarios: USUARIOS.map((u) => ({ ...u, ativo: true })),
    clientes: CLIENTES.map((c) => ({ ...c, senhaHash: null })),
    estoques,
    movimentacoes,
    transferencias,
    pedidos,
    tiposSolicitacao: TIPOS_SOLICITACAO,
    atendimentos,
    mensagens,
  }
}
