import { PRODUTOS } from './catalogo'
import { CLIENTES } from './pessoas'
import { createRandom, daysAgo } from './random'

export const TIPOS_SOLICITACAO = [
  { id: 1, titulo: 'Troca de produto', categoria: 'Pós-venda', exigeVenda: true, ordemExibicao: 1, ativo: true, descricao: 'Troca por outro tamanho, cor ou modelo.' },
  { id: 2, titulo: 'Devolução e reembolso', categoria: 'Pós-venda', exigeVenda: true, ordemExibicao: 2, ativo: true, descricao: 'Devolução em até 30 dias após o recebimento.' },
  { id: 3, titulo: 'Acompanhamento de entrega', categoria: 'Pedidos', exigeVenda: true, ordemExibicao: 3, ativo: true, descricao: 'Dúvidas sobre prazo ou status do envio.' },
  { id: 4, titulo: 'Ajuste de costura', categoria: 'Serviços', exigeVenda: true, ordemExibicao: 4, ativo: true, descricao: 'Barra, ajuste de cintura ou mangas.' },
  { id: 5, titulo: 'Reserva em outra loja', categoria: 'Disponibilidade', exigeVenda: false, ordemExibicao: 5, ativo: true, descricao: 'Reservar uma peça disponível em outra unidade.' },
  { id: 6, titulo: 'Dúvida sobre produto', categoria: 'Informações', exigeVenda: false, ordemExibicao: 6, ativo: true, descricao: 'Medidas, composição e cuidados com a peça.' },
  { id: 7, titulo: 'Reclamação', categoria: 'Qualidade', exigeVenda: false, ordemExibicao: 7, ativo: true, descricao: 'Relate um problema com produto ou atendimento.' },
  { id: 8, titulo: 'Outro assunto', categoria: 'Outros', exigeVenda: false, ordemExibicao: 8, ativo: true, descricao: 'Qualquer outra dúvida ou pedido.' },
]

// Pedidos de venda (consultados pelo portal do cliente e vinculados a atendimentos)
export function buildPedidos(variacoes) {
  const rand = createRandom(1987)
  const pedidos = []
  for (let i = 0; i < 40; i++) {
    const cliente = CLIENTES[(i + 1) % CLIENTES.length]
    const dias = Math.round(((40 - i) / 40) * 70) + rand.int(0, 2)
    const canal = i >= 30 || rand.chance(0.4) ? 'E-commerce' : 'Loja física'
    const itens = Array.from({ length: rand.int(1, 3) }, () => {
      const variacao = rand.pick(variacoes.filter((v) => v.produtoId !== 13))
      const produto = PRODUTOS.find((p) => p.id === variacao.produtoId)
      return { variacaoId: variacao.id, quantidade: 1, precoUnitario: produto.precoBase }
    })
    let status = 'ENTREGUE'
    if (canal === 'E-commerce' && dias <= 3) status = 'PROCESSANDO'
    else if (canal === 'E-commerce' && dias <= 17) status = 'ENVIADO'
    if (i === 17) status = 'CANCELADO'
    pedidos.push({
      id: i + 1,
      numero: `CL-${104820 + i * 7}`,
      clienteId: cliente.id,
      lojaId: canal === 'Loja física' ? cliente.lojaPreferidaId : 1,
      canal,
      status,
      criadoEm: daysAgo(dias, rand.int(10, 20), rand.int(0, 59)),
      codigoRastreio: canal === 'E-commerce' && status !== 'PROCESSANDO' ? `BR${rand.int(100000000, 999999999)}SP` : null,
      itens,
      total: itens.reduce((sum, item) => sum + item.precoUnitario * item.quantidade, 0),
    })
  }
  return pedidos
}

// Roteiros de atendimento escritos à mão para soar como casos reais.
// autorTipo: CLIENTE | ATENDENTE | SISTEMA
const ROTEIROS = [
  {
    clienteId: 101, tipoId: 1, status: 'EM_ANDAMENTO', responsavelId: 2, dias: 2, pedidoIndex: 0,
    mensagens: [
      ['CLIENTE', 'Olá! Comprei o item {produto} ({cor}, tamanho {tamanho}), mas ficou grande. Gostaria de trocar por um tamanho menor, na mesma cor.', 0],
      ['ATENDENTE', 'Oi, Mariana! Tudo bem? Verifiquei aqui e temos a numeração menor disponível na Oscar Freire. Posso separar para você retirar a partir de amanhã?', 3],
      ['CLIENTE', 'Perfeito, pode separar sim. Passo aí na quinta à tarde.', 5],
    ],
  },
  {
    clienteId: 101, tipoId: 4, status: 'CONCLUIDO', responsavelId: 2, dias: 21, pedidoIndex: 1,
    mensagens: [
      ['CLIENTE', 'Preciso de um pequeno ajuste no item {produto}. Vocês fazem na loja?', 0],
      ['ATENDENTE', 'Fazemos sim! O ajuste é cortesia e fica pronto em até 5 dias úteis. Pode trazer a peça na Oscar Freire.', 2],
      ['SISTEMA', 'Peça recebida para ajuste na loja Oscar Freire.', 30],
      ['ATENDENTE', 'Mariana, sua peça já está pronta para retirada. Obrigado pela preferência!', 120],
    ],
  },
  {
    clienteId: 102, tipoId: 3, status: 'ABERTO', responsavelId: null, dias: 0, pedidoIndex: 0,
    mensagens: [['CLIENTE', 'Meu pedido consta como enviado, mas o rastreio não atualiza há mais de uma semana. Podem verificar com a transportadora?', 0]],
  },
  {
    clienteId: 103, tipoId: 5, status: 'AGUARDANDO_CLIENTE', responsavelId: 4, dias: 1,
    mensagens: [
      ['CLIENTE', 'Vi no site o vestido midi de seda verde oliva no tamanho P. Tem no Leblon? Se não tiver, conseguem trazer de outra loja?', 0],
      ['ATENDENTE', 'Oi, Juliana! No Leblon não temos o P, mas a Oscar Freire tem uma peça. Consigo solicitar a transferência e ela chega em até 3 dias úteis. Posso seguir?', 4],
    ],
  },
  {
    clienteId: 104, tipoId: 2, status: 'EM_ANDAMENTO', responsavelId: 5, dias: 3, pedidoIndex: 0,
    mensagens: [
      ['CLIENTE', 'Gostaria de devolver o item {produto}. O tamanho {tamanho} não serviu e não há numeração disponível para troca.', 0],
      ['ATENDENTE', 'Felipe, recebemos sua solicitação. O reembolso é feito na mesma forma de pagamento após a conferência da peça na loja Pátio Batel.', 6],
    ],
  },
  {
    clienteId: 105, tipoId: 7, status: 'ABERTO', responsavelId: null, dias: 0,
    mensagens: [['CLIENTE', 'O suéter de cashmere que comprei começou a formar bolinhas depois de duas lavagens à mão, seguindo a etiqueta. Gostaria de uma avaliação.', 0]],
  },
  {
    clienteId: 106, tipoId: 6, status: 'CONCLUIDO', responsavelId: 8, dias: 9,
    mensagens: [
      ['CLIENTE', 'Qual o material da jaqueta de camurça Capri? Ela mancha com chuva?', 0],
      ['ATENDENTE', 'Gustavo, a Jaqueta Capri é em camurça de couro bovino, com forro de viscose. Ela resiste a garoa, mas recomendamos evitar chuva forte e aplicar impermeabilizante para camurça.', 1],
      ['CLIENTE', 'Ótimo, obrigado!', 2],
    ],
  },
  {
    clienteId: 107, tipoId: 1, status: 'ABERTO', responsavelId: null, dias: 1, pedidoIndex: 0,
    mensagens: [['CLIENTE', 'Ganhei o item {produto} de presente no tamanho {tamanho} e preciso trocar por outro tamanho. Tenho a nota fiscal.', 0]],
  },
  {
    clienteId: 108, tipoId: 3, status: 'CONCLUIDO', responsavelId: 1, dias: 15, pedidoIndex: 1,
    mensagens: [
      ['CLIENTE', 'Meu pedido ainda está em separação. Há previsão de envio?', 0],
      ['ATENDENTE', 'Thiago, seu pedido foi despachado hoje. O código de rastreio já está disponível no portal.', 5],
    ],
  },
  {
    clienteId: 103, tipoId: 4, status: 'EM_ANDAMENTO', responsavelId: 4, dias: 5, pedidoIndex: 0,
    mensagens: [
      ['CLIENTE', 'Gostaria de ajustar a cintura do item {produto}. É possível?', 0],
      ['ATENDENTE', 'É possível sim, Juliana. Nossa costureira atende no Leblon às terças e quintas. Pode trazer a peça quando quiser.', 3],
      ['SISTEMA', 'Peça recebida para ajuste na loja Leblon.', 50],
    ],
  },
  {
    clienteId: 102, tipoId: 6, status: 'AGUARDANDO_CLIENTE', responsavelId: 3, dias: 4,
    mensagens: [
      ['CLIENTE', 'O trench coat tem forro removível?', 0],
      ['ATENDENTE', 'Ricardo, o forro não é removível, mas é em viscose leve, ideal para meia-estação. Quer que eu reserve um para você provar no Lago Sul?', 2],
    ],
  },
  {
    clienteId: 101, tipoId: 6, status: 'CONCLUIDO', responsavelId: 1, dias: 40,
    mensagens: [
      ['CLIENTE', 'O lenço de seda pode ser lavado à mão?', 0],
      ['ATENDENTE', 'Recomendamos lavagem a seco para preservar a estampa e o brilho da seda.', 1],
    ],
  },
]

// Mensagens podem citar {produto}, {cor} e {tamanho} do primeiro item do pedido vinculado.
function preencher(texto, pedido, variacoes) {
  const variacao = pedido && variacoes.find((v) => v.id === pedido.itens[0].variacaoId)
  if (!variacao) return texto
  const produto = PRODUTOS.find((p) => p.id === variacao.produtoId)
  return texto.replace('{produto}', produto.nome).replace('{cor}', variacao.cor).replace('{tamanho}', variacao.tamanho)
}

export function buildAtendimentos(pedidos, variacoes) {
  const rand = createRandom(4410)
  const atendimentos = []
  const mensagens = []
  let mensagemId = 1

  ROTEIROS.forEach((roteiro, index) => {
    const id = index + 1
    const cliente = CLIENTES.find((c) => c.id === roteiro.clienteId)
    const pedidosCliente = pedidos.filter((p) => p.clienteId === roteiro.clienteId)
    const pedido = roteiro.pedidoIndex !== undefined ? pedidosCliente[pedidosCliente.length - 1 - roteiro.pedidoIndex] : null
    const criadoEm = daysAgo(roteiro.dias, rand.int(9, 15), rand.int(0, 59))

    let ultima = criadoEm
    roteiro.mensagens.forEach(([autorTipo, conteudo, horas]) => {
      const enviadoEm = Math.min(criadoEm + horas * 3600000 + rand.int(0, 40) * 60000, Date.now() - 120000)
      ultima = enviadoEm
      mensagens.push({
        id: mensagemId++,
        atendimentoId: id,
        autorId: autorTipo === 'CLIENTE' ? roteiro.clienteId : autorTipo === 'ATENDENTE' ? roteiro.responsavelId : null,
        autorTipo,
        conteudo: preencher(conteudo, pedido, variacoes),
        enviadoEm,
      })
    })

    atendimentos.push({
      id,
      protocolo: `ATD-${String(26000 + id * 37).padStart(6, '0')}`,
      solicitanteId: roteiro.clienteId,
      responsavelId: roteiro.responsavelId,
      tipoSolicitacaoId: roteiro.tipoId,
      status: roteiro.status,
      pedidoId: pedido?.id ?? null,
      lojaId: pedido?.lojaId ?? cliente.lojaPreferidaId,
      criadoEm,
      atualizadoEm: ultima,
    })
  })

  return { atendimentos, mensagens }
}
