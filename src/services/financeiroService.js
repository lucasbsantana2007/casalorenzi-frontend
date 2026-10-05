import { USE_MOCKS } from '../config/env'
import { api } from './api'
import * as mock from './mock/financeiro'

export const financeiroService = USE_MOCKS
  ? mock
  : {
      // { de, ate, comparar, agrupar, lojas, canais, categorias, generos } (listas separadas por vírgula)
      obterResumo: (filtros) => api.get('/financeiro/resumo', filtros),
    }
