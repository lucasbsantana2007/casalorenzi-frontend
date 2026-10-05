import { USE_MOCKS } from '../config/env'
import { api } from './api'
import * as mock from './mock/financeiro'

export const financeiroService = USE_MOCKS
  ? mock
  : {
      obterResumo: () => api.get('/financeiro/resumo'),
    }
