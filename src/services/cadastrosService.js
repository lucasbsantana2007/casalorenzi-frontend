import { USE_MOCKS } from '../config/env'
import { api } from './api'
import * as mock from './mock/cadastros'

// Cadastros de apoio usados em filtros e formulários.
export const cadastrosService = USE_MOCKS
  ? mock
  : {
      // filtros: { marca } (LORENZI ou VULTO). Visitante sem marca recebe a Casa Lorenzi; a equipe, todas
      listarLojas: (filtros) => api.get('/lojas', filtros),
      listarCategorias: () => api.get('/categorias'),
      listarUsuarios: (filtros) => api.get('/usuarios', filtros),
      listarTiposSolicitacao: () => api.get('/tipos-solicitacao', { ativo: true }),
    }
