import { buildAtendimentos, buildPedidos, TIPOS_SOLICITACAO } from './atendimento'
import { CATEGORIAS, LOJAS, PRODUTOS } from './catalogo'
import { DETALHES_PRODUTOS } from './detalhesProdutos'
import { FRETE_INICIAL } from './frete'
import { buildEstoque, buildVariacoes } from './estoque'
import { CLIENTES, USUARIOS } from './pessoas'
import { buildOperacaoVulto, buildVulto, CATEGORIAS_VULTO, CD_VULTO, LOJAS_VULTO, PRODUTOS_VULTO } from './vulto'

// Monta o estado inicial completo dos dados de demonstração.
export function createSeed() {
  const variacoes = buildVariacoes()
  const { estoques, movimentacoes, transferencias } = buildEstoque(variacoes)
  const pedidos = buildPedidos(variacoes)
  const { atendimentos, mensagens } = buildAtendimentos(pedidos, variacoes)
  // Vulto: lojas, CD, catálogo e o saldo migrado, com ids depois dos da Casa Lorenzi
  const ultimo = (lista) => lista.reduce((max, item) => Math.max(max, item.id), 0) + 1
  const vulto = buildVulto({ primeiraVariacao: ultimo(variacoes), primeiroEstoque: ultimo(estoques), primeiraMovimentacao: ultimo(movimentacoes) })
  const operacao = buildOperacaoVulto({
    variacoes: vulto.variacoes,
    estoques: vulto.estoques,
    movimentacoes: vulto.movimentacoes,
    ids: {
      pedido: ultimo(pedidos),
      movimentacao: ultimo([...movimentacoes, ...vulto.movimentacoes]),
      atendimento: ultimo(atendimentos),
      mensagem: ultimo(mensagens),
      transferencia: ultimo(transferencias),
    },
  })

  return {
    lojas: [
      ...LOJAS.map((loja) => ({ ...loja, marca: 'LORENZI', tipo: 'LOJA', horarios: [...loja.horarios] })),
      ...LOJAS_VULTO.map((loja) => ({ ...loja, horarios: [...loja.horarios] })),
      { ...CD_VULTO, horarios: [] },
    ],
    categorias: [...new Set([...CATEGORIAS, ...CATEGORIAS_VULTO])],
    produtos: [
      ...PRODUTOS.map(({ id, nome, categoria, precoBase, genero, estacao, ativo = true }) => ({
        id,
        marca: 'LORENZI',
        nome,
        categoria,
        precoBase,
        genero,
        estacao,
        ativo,
        ...DETALHES_PRODUTOS[id],
      })),
      ...PRODUTOS_VULTO.map(({ cores: _cores, tamanhos: _tamanhos, ...produto }) => produto),
    ],
    // Preço de custo de demonstração: 40% do preço de venda (Vulto: 38%, em buildVulto)
    variacoes: [
      ...variacoes.map((v) => ({ ...v, precoCusto: Math.round(PRODUTOS.find((p) => p.id === v.produtoId).precoBase * 0.4 * 100) / 100 })),
      ...vulto.variacoes,
    ],
    frete: structuredClone(FRETE_INICIAL),
    // Funcionários (equipe) e clientes ficam em tabelas separadas; o id do cliente é o CPF.
    // senhaHash null: cliente de demonstração, entra com a senha de demonstração
    usuarios: USUARIOS.map((u) => ({ ...u, ativo: true })),
    clientes: CLIENTES.map((c) => ({ ...c, senhaHash: null })),
    estoques: [...estoques, ...vulto.estoques],
    movimentacoes: [...movimentacoes, ...vulto.movimentacoes],
    transferencias: [...transferencias, ...operacao.transferencias],
    pedidos: [...pedidos, ...operacao.pedidos],
    tiposSolicitacao: TIPOS_SOLICITACAO,
    atendimentos: [...atendimentos, ...operacao.atendimentos],
    mensagens: [...mensagens, ...operacao.mensagens],
  }
}
