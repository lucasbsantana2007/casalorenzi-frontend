import { USE_MOCKS } from '../config/env'
import { api } from './api'
import * as mock from './mock/cadastros'

// Cadastros de apoio usados em filtros e formulários.
export const cadastrosService = USE_MOCKS
  ? mock
  : {
      listarLojas: () => api.get('/lojas'),
      listarCategorias: () => api.get('/categorias'),
      listarUsuarios: (filtros) => api.get('/usuarios', filtros),
      listarTiposSolicitacao: () => api.get('/tipos-solicitacao', { ativo: true }),
    }
