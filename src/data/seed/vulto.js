import { createRandom, daysAgo } from './random'

// Vulto nos dados de demonstração: as lojas, o CD e uma seleção do catálogo 2026 migrado
// (copy.vulto-legado-back, produtos_padronizados), com o código do modelo da Vulto. As fotos (frente e
// costas, em assets/vulto) são ligadas pelo código do modelo, e a cor de cada peça é a da foto.
// O estoque entra como o saldo migrado.

export const LOJAS_VULTO = [
  {
    id: 6,
    nome: 'Vulto Pinheiros',
    cidade: 'São Paulo',
    uf: 'SP',
    endereco: 'Rua dos Pinheiros, 1037 - Pinheiros, São Paulo - SP',
    telefone: '+55 11 94102-3381',
    horarios: ['Segunda a sábado: 10:00–21:00', 'Domingo: 12:00–19:00'],
  },
  {
    id: 7,
    nome: 'Vulto Shopping Eldorado',
    cidade: 'São Paulo',
    uf: 'SP',
    endereco: 'Av. Rebouças, 3970, Piso Térreo - Pinheiros, São Paulo - SP',
    telefone: '+55 11 94102-3392',
    horarios: ['Segunda a sábado: 10:00–22:00', 'Domingo: 14:00–20:00'],
  },
  {
    id: 8,
    nome: 'Vulto Savassi',
    cidade: 'Belo Horizonte',
    uf: 'MG',
    endereco: 'Rua Pernambuco, 1000 - Savassi, Belo Horizonte - MG',
    telefone: '+55 31 98820-4410',
    horarios: ['Segunda a sábado: 10:00–20:00'],
  },
  {
    id: 9,
    nome: 'Vulto Batel',
    cidade: 'Curitiba',
    uf: 'PR',
    endereco: 'Av. do Batel, 1550 - Batel, Curitiba - PR',
    telefone: '+55 41 99731-2207',
    horarios: ['Segunda a sábado: 10:00–20:00', 'Domingo: 12:00–18:00'],
  },
].map((loja) => ({ ...loja, marca: 'VULTO', tipo: 'LOJA', ativa: true }))

// O CD despacha as vendas do site e do app da Vulto; não aparece na página Lojas
export const CD_VULTO = { id: 10, nome: 'CD Cajamar', cidade: 'Cajamar', uf: 'SP', endereco: '', telefone: '', horarios: [], marca: 'VULTO', tipo: 'CD', ativa: true }

const LETRAS = ['P', 'M', 'G', 'GG']
const NUMEROS = ['38', '40', '42', '44']

// [id, código do modelo, nome, categoria, preço, cores, tamanhos, estação]
const CATALOGO = [
  [101, 'CAL-005', 'Calça Jogger Ripstop', 'Calças', 359.9, ['Verde Oliva'], NUMEROS, 'Verão'],
  [102, 'CAL-021', 'Calça Jeans Reta Parachute', 'Calças', 309.9, ['Jeans Médio'], NUMEROS, 'Verão'],
  [103, 'CAL-023', 'Calça Alfaiataria Parachute', 'Calças', 269.9, ['Grafite'], NUMEROS, 'Verão'],
  [104, 'CAM-016', 'Camiseta Oversized Urbana', 'Camisetas', 149.9, ['Off White'], LETRAS, 'Verão'],
  [105, 'CAM-020', 'Camiseta Estampada Vintage', 'Camisetas', 89.9, ['Preto'], LETRAS, 'Verão'],
  [106, 'CMS-010', 'Camisa Cuban Bolso', 'Camisas', 279.9, ['Off White'], LETRAS, 'Verão'],
  [107, 'CMS-011', 'Camisa Jeans Estonada', 'Camisas', 249.9, ['Jeans Claro'], LETRAS, 'Verão'],
  [108, 'MOL-004', 'Hoodie Oversized Bordado', 'Moletons', 299.9, ['Marrom'], LETRAS, 'Inverno'],
  [109, 'MOL-013', 'Moletom Careca Fleece', 'Moletons', 219.9, ['Cinza Mescla'], LETRAS, 'Inverno'],
  [110, 'JAQ-007', 'Corta-Vento Utilitária', 'Jaquetas', 489.9, ['Grafite'], LETRAS, 'Inverno'],
  [111, 'TOP-012', 'Top Alcinha Canelado', 'Tops e Croppeds', 149.9, ['Preto'], ['P', 'M', 'G'], 'Verão'],
  [112, 'SAI-008', 'Saia Cargo Cetim', 'Saias', 219.9, ['Verde Oliva'], ['P', 'M', 'G'], 'Verão'],
  [113, 'VES-010', 'Vestido Midi Cetim', 'Vestidos', 249.9, ['Azul Marinho'], ['P', 'M', 'G'], 'Verão'],
  [114, 'BER-007', 'Bermuda Moletom Ampla', 'Bermudas e Shorts', 189.9, ['Preto'], NUMEROS, 'Verão'],
  [115, 'TRI-012', 'Cardigan Listrado', 'Tricô', 299.9, ['Off White e Marinho'], LETRAS, 'Inverno'],
  [116, 'ACE-013', 'Bucket Hat Listrado', 'Acessórios', 149.9, ['Off White'], ['U'], 'Inverno'],
  [117, 'CAL-028', 'Calça Wide Leg Pregas', 'Calças', 289.9, ['Bege'], NUMEROS, 'Inverno'],
  [118, 'ACE-012', 'Boné Logo', 'Acessórios', 49.9, ['Preto'], ['U'], 'Inverno'],
]

export const CATEGORIAS_VULTO = [...new Set(CATALOGO.map((p) => p[3]))]

export const PRODUTOS_VULTO = CATALOGO.map(([id, codigoModelo, nome, categoria, precoBase, cores, tamanhos, estacao]) => ({
  id,
  marca: 'VULTO',
  codigoModelo,
  nome,
  categoria,
  precoBase,
  genero: null,
  estacao,
  ativo: true,
  cores,
  tamanhos,
  descricao: null,
}))

const siglaCor = (cor) =>
  cor
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(' ')
    .map((parte) => parte.slice(0, 3))
    .join('')
    .slice(0, 3)
    .toUpperCase()

// Variações (SKU no padrão da Vulto migrada: VLT-<modelo>-<cor>-<tamanho>) e o estoque nas lojas e no CD
export function buildVulto({ primeiraVariacao, primeiroEstoque, primeiraMovimentacao }) {
  const rand = createRandom(20261001)
  const variacoes = []
  const estoques = []
  const movimentacoes = []
  let variacaoId = primeiraVariacao
  let estoqueId = primeiroEstoque
  let movId = primeiraMovimentacao
  const migradoEm = daysAgo(21, 8, 0) // carga única de 01/10/2026

  for (const produto of PRODUTOS_VULTO) {
    for (const cor of produto.cores) {
      for (const tamanho of produto.tamanhos) {
        const variacao = {
          id: variacaoId++,
          produtoId: produto.id,
          sku: `VLT-${produto.codigoModelo}-${siglaCor(cor)}-${tamanho}`,
          tamanho,
          cor,
          precoCusto: Math.round(produto.precoBase * 0.38 * 100) / 100,
        }
        variacoes.push(variacao)
        for (const loja of [...LOJAS_VULTO, CD_VULTO]) {
          const quantidade = loja.tipo === 'CD' ? rand.int(6, 18) : rand.int(0, 5)
          const id = estoqueId++
          estoques.push({ id, lojaId: loja.id, variacaoId: variacao.id, quantidade, quantidadeMin: loja.tipo === 'CD' ? 6 : 2, atualizadoEm: migradoEm })
          movimentacoes.push({
            id: movId++,
            estoqueId: id,
            tipo: 'ENTRADA',
            quantidade,
            saldoResultante: quantidade,
            criadoEm: migradoEm,
            origem: 'Saldo migrado da Vulto (01/10/2026)',
            usuarioId: 1,
          })
        }
      }
    }
  }
  return { variacoes, estoques, movimentacoes }
}
