import { USE_MOCKS } from '../config/env'
import { api } from './api'
import * as mock from './mock/estoque'

// Estoque é controlado por LOJA + VARIAÇÃO (SKU).
export const estoqueService = USE_MOCKS
  ? mock
  : {
      // filtros: { busca, lojaId, categoria, status, variacaoId }
      listar: (filtros) => api.get('/estoque', filtros),
      obter: (id) => api.get(`/estoque/${id}`),
      // filtros: { estoqueId, lojaId, tipo, de, ate, busca } — datas em yyyy-mm-dd
      listarMovimentacoes: (filtros) => api.get('/movimentacoes', filtros),
      // { data, lojaId, busca } → { data, itens: [...estoque, quantidadeNaData] }
      posicaoEmData: (filtros) => api.get('/estoque/posicao', filtros),
      // { estoqueId, tipo, quantidade (com sinal), origem, usuarioId }
      registrarMovimentacao: (dados) => api.post('/movimentacoes', dados),
    }
