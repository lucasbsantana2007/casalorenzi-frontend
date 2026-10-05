import { USE_MOCKS } from '../config/env'
import { api } from './api'
import * as mock from './mock/atendimento'

// Painel interno de atendimento.
export const atendimentoService = USE_MOCKS
  ? { listar: mock.listar, obter: mock.obter, atualizar: mock.atualizar, enviarMensagem: mock.enviarMensagem }
  : {
      // filtros: { busca, tipoSolicitacaoId, responsavelId ('nenhum' = sem responsável), lojaId }
      listar: (filtros) => api.get('/atendimentos', filtros),
      obter: (id) => api.get(`/atendimentos/${id}`),
      // { status?, responsavelId? }
      atualizar: (id, dados) => api.patch(`/atendimentos/${id}`, dados),
      // { conteudo, autorId, autorTipo: 'ATENDENTE' | 'CLIENTE' }
      enviarMensagem: (id, dados) => api.post(`/atendimentos/${id}/mensagens`, dados),
    }
