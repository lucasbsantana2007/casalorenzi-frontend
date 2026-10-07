import { USE_MOCKS } from '../config/env'
import { api } from './api'
import * as mock from './mock/produtos'

export const produtosService = USE_MOCKS
  ? mock
  : {
      // filtros: { busca, categoria, ativo }
      listar: (filtros) => api.get('/produtos', filtros),
      obter: (id) => api.get(`/produtos/${id}`),
      // { nome, categoria, precoBase, ativo, variacoes: [{ id?, sku, tamanho, cor, precoCusto }] }
      // Só Administrador; o preço de custo nunca vai para as rotas públicas da loja
      criar: (dados) => api.post('/produtos', dados),
      atualizar: (id, dados) => api.put(`/produtos/${id}`, dados),
    }
