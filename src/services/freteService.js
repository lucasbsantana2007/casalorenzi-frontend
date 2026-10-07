import { USE_MOCKS } from '../config/env'
import { api } from './api'
import * as mock from './mock/frete'

// Frete por região do CEP. O site só recebe valores e prazos; o custo é exclusivo do Administrador.
export const freteService = USE_MOCKS
  ? mock
  : {
      // Público → { gratisMinimo, expressoAtivo, regioes: [{ regiao, nome, padrao: { valor, prazoDias }, expresso }] }
      condicoes: () => api.get('/frete/condicoes'),
      // Administrador → mesma estrutura, com `custo` em cada faixa
      obterConfig: () => api.get('/frete/config'),
      // Administrador. Grava no log cada valor alterado
      salvarConfig: (dados) => api.put('/frete/config', dados),
      // Administrador. { cep, subtotal } → [{ tipo, label, valor, custo, prazoDias, resultado }]
      simular: (dados) => api.post('/frete/simulacao', dados),
    }
