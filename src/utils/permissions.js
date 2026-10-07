// Controle de acesso por perfil. Hoje é aplicado apenas na navegação e nas rotas;
// o backend deve validar as mesmas regras a partir do token do usuário.

export const PAPEIS = {
  ADMINISTRADOR: 'Administrador',
  LOJISTA: 'Lojista',
  OPERADOR: 'Operador',
}

const ACESSO = {
  dashboard: ['ADMINISTRADOR', 'LOJISTA', 'OPERADOR'],
  estoque: ['ADMINISTRADOR', 'LOJISTA', 'OPERADOR'],
  // Lojista e operador veem os pedidos que a própria loja expede
  pedidos: ['ADMINISTRADOR', 'LOJISTA', 'OPERADOR'],
  produtos: ['ADMINISTRADOR'],
  transferencias: ['ADMINISTRADOR', 'OPERADOR'],
  atendimento: ['ADMINISTRADOR', 'LOJISTA'],
  financeiro: ['ADMINISTRADOR'],
  administracao: ['ADMINISTRADOR'],
}

export function podeAcessar(papel, modulo) {
  return ACESSO[modulo]?.includes(papel) ?? false
}
