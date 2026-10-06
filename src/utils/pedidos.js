// Pedido em separação que ainda depende de peças vindas de outra loja
export const aguardaTransferencia = (p) =>
  p.status === 'PROCESSANDO' && p.transferencias.some((t) => ['SOLICITADA', 'EM_TRANSITO'].includes(t.status))

export const FORMA_PAGAMENTO = { PIX: 'Pix', CARTAO: 'Cartão de crédito' }
