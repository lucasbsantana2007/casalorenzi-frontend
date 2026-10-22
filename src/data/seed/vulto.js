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

// ---------- Operação da Vulto na demonstração ----------
// Pedidos (site, app e lojas), as vendas que eles baixaram do estoque, atendimentos de WhatsApp e
// Instagram e transferências entre as lojas e o CD, para o painel da Vulto ter o que mostrar.
const CLIENTES_VULTO = ['15881399803', '69879730917', '11417075350', '64556815177', '88447294072', '97880932054']
const CANAIS = ['E-commerce', 'App', 'Loja física']

// [canal, tipo de solicitação, status, responsável, dias atrás, falas (cliente e atendente alternados)]
const CONVERSAS_VULTO = [
  ['WHATSAPP', 1, 'EM_ANDAMENTO', 10, 1, ['Oi! Comprei a {produto} e veio grande, dá pra trocar por um número menor?', 'Oi! Dá sim. Você prefere trocar na Vulto Pinheiros ou pelo site?', 'Na Pinheiros, passo amanhã.']],
  ['INSTAGRAM', 6, 'ABERTO', null, 0, ['Vocês vão ter reposição da {produto} na cor {cor}?']],
  ['WHATSAPP', 3, 'ABERTO', null, 3, ['Meu pedido saiu do CD há 3 dias e ainda não chegou. Tem previsão?']],
  ['INSTAGRAM', 2, 'CONCLUIDO', 10, 12, ['Quero devolver a {produto}, não serviu.', 'Tudo certo! Abrimos a devolução e o estorno cai em até 5 dias úteis.']],
  ['WHATSAPP', 5, 'EM_ANDAMENTO', 9, 2, ['Consegue reservar a {produto} tamanho {tamanho} na Savassi?', 'Reservado até sábado, é só falar seu nome no caixa.']],
]

export function buildOperacaoVulto({ variacoes, estoques, movimentacoes, ids }) {
  const rand = createRandom(20261022)
  const pedidos = []
  const novasMovs = []
  let movId = ids.movimentacao
  const estoqueDe = (lojaId, variacaoId) => estoques.find((e) => e.lojaId === lojaId && e.variacaoId === variacaoId)
  const precoDe = (variacaoId) => PRODUTOS_VULTO.find((p) => p.id === variacoes.find((v) => v.id === variacaoId).produtoId).precoBase

  // Venda baixa o estoque da loja (ou do CD, nas vendas online) com uma movimentação VENDA
  const vender = (lojaId, variacaoId, quando, origem) => {
    const estoque = estoqueDe(lojaId, variacaoId)
    if (!estoque || estoque.quantidade < 1) return false
    estoque.quantidade -= 1
    estoque.atualizadoEm = quando
    novasMovs.push({ id: movId++, estoqueId: estoque.id, tipo: 'VENDA', quantidade: -1, saldoResultante: estoque.quantidade, criadoEm: quando, origem, usuarioId: lojaId === CD_VULTO.id ? 11 : 10 })
    return true
  }

  for (let i = 0; i < 36; i++) {
    const canal = CANAIS[i % 3]
    const lojaId = canal === 'Loja física' ? LOJAS_VULTO[i % LOJAS_VULTO.length].id : CD_VULTO.id
    const dias = Math.round(((36 - i) / 36) * 60)
    const quando = daysAgo(dias, rand.int(10, 21), rand.int(0, 59))
    const numero = `VLT-${70100 + i * 3}`
    const itens = []
    const quantidadeDeItens = rand.int(1, 2)
    for (let k = 0; k < quantidadeDeItens; k++) {
      const variacao = rand.pick(variacoes)
      const origem = `${canal === 'Loja física' ? 'Venda PDV' : `Venda ${canal}`} · ${numero}`
      if (vender(lojaId, variacao.id, quando, origem)) itens.push({ variacaoId: variacao.id, quantidade: 1, precoUnitario: precoDe(variacao.id) })
    }
    if (!itens.length) continue
    let status = 'ENTREGUE'
    if (canal !== 'Loja física' && dias <= 2) status = 'PROCESSANDO'
    else if (canal !== 'Loja física' && dias <= 10) status = 'ENVIADO'
    if (i === 20) status = 'CANCELADO'
    const total = itens.reduce((s, item) => s + item.precoUnitario, 0)
    pedidos.push({
      id: ids.pedido + pedidos.length,
      numero,
      clienteId: CLIENTES_VULTO[i % CLIENTES_VULTO.length],
      lojaId,
      canal,
      status,
      criadoEm: quando,
      codigoRastreio: canal !== 'Loja física' && status !== 'PROCESSANDO' ? `BR${rand.int(100000000, 999999999)}SP` : null,
      itens,
      subtotal: total,
      desconto: 0,
      total,
      historico: [],
    })
  }

  // Atendimentos dos canais da Vulto (WhatsApp e Instagram), ligados a um pedido
  const atendimentos = []
  const mensagens = []
  let mensagemId = ids.mensagem
  CONVERSAS_VULTO.forEach(([canal, tipoId, status, responsavelId, dias, falas], index) => {
    const pedido = pedidos[pedidos.length - 1 - index * 4]
    const variacao = variacoes.find((v) => v.id === pedido.itens[0].variacaoId)
    const produto = PRODUTOS_VULTO.find((p) => p.id === variacao.produtoId)
    const id = ids.atendimento + index
    const criadoEm = daysAgo(dias, rand.int(9, 15), rand.int(0, 59))
    let ultima = criadoEm
    falas.forEach((texto, f) => {
      ultima = Math.min(criadoEm + f * 2 * 3600000, Date.now() - 60000)
      mensagens.push({
        id: mensagemId++,
        atendimentoId: id,
        autorId: f % 2 === 0 ? pedido.clienteId : responsavelId,
        autorTipo: f % 2 === 0 ? 'CLIENTE' : 'ATENDENTE',
        conteudo: texto.replace('{produto}', produto.nome).replace('{cor}', variacao.cor).replace('{tamanho}', variacao.tamanho),
        enviadoEm: ultima,
      })
    })
    atendimentos.push({
      id,
      protocolo: `VLT-${40000 + id}`,
      marca: 'VULTO',
      canal,
      solicitanteId: pedido.clienteId,
      responsavelId,
      tipoSolicitacaoId: tipoId,
      status,
      pedidoId: pedido.id,
      lojaId: pedido.lojaId === CD_VULTO.id ? null : pedido.lojaId,
      criadoEm,
      atualizadoEm: ultima,
    })
  })

  // Transferências do CD para as lojas e entre lojas
  const transferencias = []
  const roteiro = [
    [CD_VULTO.id, 6, 'CONCLUIDA', 9],
    [CD_VULTO.id, 8, 'EM_TRANSITO', 2],
    [7, 6, 'SOLICITADA', 1],
    [CD_VULTO.id, 9, 'SOLICITADA', 0],
  ]
  const nomeDa = (lojaId) => [...LOJAS_VULTO, CD_VULTO].find((l) => l.id === lojaId).nome
  roteiro.forEach(([origem, destino, status, dias], index) => {
    const variacao = variacoes[(index * 7) % variacoes.length]
    const id = ids.transferencia + index
    const codigo = `TRF-${String(id).padStart(4, '0')}`
    const criadoEm = daysAgo(dias, 9, 30)
    const enviadoEm = status === 'EM_TRANSITO' || status === 'CONCLUIDA' ? criadoEm + 2 * 3600000 : null
    const recebidoEm = status === 'CONCLUIDA' ? criadoEm + 30 * 3600000 : null
    const rota = `${codigo} · ${nomeDa(origem)} → ${nomeDa(destino)}`
    const saida = estoqueDe(origem, variacao.id)
    if (enviadoEm && saida.quantidade >= 2) {
      saida.quantidade -= 2
      novasMovs.push({ id: movId++, estoqueId: saida.id, tipo: 'TRANSFERENCIA_SAIDA', quantidade: -2, saldoResultante: saida.quantidade, criadoEm: enviadoEm, origem: rota, usuarioId: 11, transferenciaId: id })
      if (recebidoEm) {
        const entrada = estoqueDe(destino, variacao.id)
        entrada.quantidade += 2
        novasMovs.push({ id: movId++, estoqueId: entrada.id, tipo: 'TRANSFERENCIA_ENTRADA', quantidade: 2, saldoResultante: entrada.quantidade, criadoEm: recebidoEm, origem: rota, usuarioId: 10, transferenciaId: id })
      }
    }
    transferencias.push({ id, codigo, variacaoId: variacao.id, lojaOrigemId: origem, lojaDestinoId: destino, quantidade: 2, status, solicitanteId: 10, responsavelId: 11, criadoEm, enviadoEm, recebidoEm, observacao: 'Reposição de grade' })
  })

  movimentacoes.push(...novasMovs)
  return { pedidos, atendimentos, mensagens, transferencias }
}
