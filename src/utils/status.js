// Rótulos e tons visuais para os status exibidos em <StatusBadge />.
// tone: neutral | info | success | warning | danger
export const STATUS = {
  estoque: {
    NORMAL: { label: 'Normal', tone: 'success' },
    BAIXO: { label: 'Estoque baixo', tone: 'warning' },
    SEM_ESTOQUE: { label: 'Sem estoque', tone: 'danger' },
  },
  produto: {
    true: { label: 'Ativo', tone: 'success' },
    false: { label: 'Inativo', tone: 'neutral' },
  },
  transferencia: {
    SOLICITADA: { label: 'Solicitada', tone: 'info' },
    EM_TRANSITO: { label: 'Em trânsito', tone: 'warning' },
    CONCLUIDA: { label: 'Concluída', tone: 'success' },
    CANCELADA: { label: 'Cancelada', tone: 'neutral' },
  },
  atendimento: {
    ABERTO: { label: 'Aberto', tone: 'info' },
    EM_ANDAMENTO: { label: 'Em andamento', tone: 'warning' },
    AGUARDANDO_CLIENTE: { label: 'Aguardando cliente', tone: 'neutral' },
    CONCLUIDO: { label: 'Concluído', tone: 'success' },
  },
  // Painel da equipe: o que fazer com o chamado. "Aguardando cliente" conta como "Em andamento".
  // As telas do cliente continuam com os rótulos de `atendimento`.
  atendimentoPainel: {
    ABERTO: { label: 'Responder', tone: 'info' },
    EM_ANDAMENTO: { label: 'Em andamento', tone: 'warning' },
    AGUARDANDO_CLIENTE: { label: 'Em andamento', tone: 'warning' },
    CONCLUIDO: { label: 'Concluído', tone: 'success' },
  },
  pedido: {
    PROCESSANDO: { label: 'Em separação', tone: 'info' },
    ENVIADO: { label: 'Enviado', tone: 'warning' },
    ENTREGUE: { label: 'Entregue', tone: 'success' },
    CANCELADO: { label: 'Cancelado', tone: 'neutral' },
  },
  movimentacao: {
    ENTRADA: { label: 'Entrada', tone: 'success' },
    VENDA: { label: 'Venda', tone: 'neutral' },
    DEVOLUCAO: { label: 'Devolução', tone: 'info' },
    AJUSTE: { label: 'Ajuste', tone: 'warning' },
    TRANSFERENCIA_SAIDA: { label: 'Transf. saída', tone: 'info' },
    TRANSFERENCIA_ENTRADA: { label: 'Transf. entrada', tone: 'info' },
  },
}

export const ATENDIMENTO_ABERTO = ['ABERTO', 'EM_ANDAMENTO', 'AGUARDANDO_CLIENTE']

// Etapas do atendimento no painel (abas e seletor de status). Cada etapa agrupa status do banco.
export const ETAPAS_ATENDIMENTO = [
  { value: 'ABERTO', label: 'Responder', status: ['ABERTO'] },
  { value: 'EM_ANDAMENTO', label: 'Em andamento', status: ['EM_ANDAMENTO', 'AGUARDANDO_CLIENTE'] },
  { value: 'CONCLUIDO', label: 'Concluído', status: ['CONCLUIDO'] },
]

// Etapa em que um status aparece no painel (ex.: AGUARDANDO_CLIENTE → EM_ANDAMENTO)
export const etapaDoAtendimento = (status) => ETAPAS_ATENDIMENTO.find((e) => e.status.includes(status))?.value ?? status

export function statusOptions(type) {
  return Object.entries(STATUS[type]).map(([value, { label }]) => ({ value, label }))
}
