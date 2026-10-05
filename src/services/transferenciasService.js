import { USE_MOCKS } from '../config/env'
import { api } from './api'
import * as mock from './mock/transferencias'

export const transferenciasService = USE_MOCKS
  ? mock
  : {
      // filtros: { status, lojaId, busca }
      listar: (filtros) => api.get('/transferencias', filtros),
      // { variacaoId, lojaOrigemId, lojaDestinoId, quantidade, observacao, usuarioId }
      criar: (dados) => api.post('/transferencias', dados),
      // { status: 'EM_TRANSITO' | 'CONCLUIDA' | 'CANCELADA', usuarioId }
      atualizarStatus: (id, dados) => api.patch(`/transferencias/${id}`, dados),
    }
