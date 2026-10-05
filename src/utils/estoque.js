// Regras de status de estoque compartilhadas entre a interface e a camada de mocks.
export function statusEstoque(quantidade, quantidadeMin) {
  if (quantidade <= 0) return 'SEM_ESTOQUE'
  if (quantidade <= quantidadeMin) return 'BAIXO'
  return 'NORMAL'
}

// Quantidade é sempre registrada com sinal: positiva entra, negativa sai.
export const TIPOS_MOVIMENTACAO = {
  ENTRADA: 'Entrada',
  VENDA: 'Venda',
  DEVOLUCAO: 'Devolução',
  AJUSTE: 'Ajuste de inventário',
  TRANSFERENCIA_SAIDA: 'Transferência (saída)',
  TRANSFERENCIA_ENTRADA: 'Transferência (entrada)',
}
