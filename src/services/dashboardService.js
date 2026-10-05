import { USE_MOCKS } from '../config/env'
import { api } from './api'
import * as mock from './mock/dashboard'

export const dashboardService = USE_MOCKS
  ? mock
  : {
      // { lojaId? } → { indicadores, resumoPorLoja, alertas, movimentacoesRecentes, atendimentosRecentes }
      obterResumo: (filtros) => api.get('/dashboard/resumo', filtros),
    }
