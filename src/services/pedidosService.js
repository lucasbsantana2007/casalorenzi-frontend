import { USE_MOCKS } from '../config/env'
import { api } from './api'
import * as mock from './mock/pedidos'

// Pedidos do e-commerce: checkout (cliente logado) e gestão no painel.
export const pedidosService = USE_MOCKS
  ? mock
  : {
      // Loja: checkout (exige cliente logado; o cliente vem do token, não do corpo)
      // { endereco, freteTipo, pagamento: { metodo, parcelas }, itens: [{ variacaoId, quantidade }] }
      // O pedido grava clienteId = CPF do cliente. 401 sem sessão de cliente
      finalizarCompra: ({ clienteId: _clienteId, ...dados }) => api.post('/checkout', dados),

      // Painel (equipe)
      // filtros: { status, lojaId, canal, busca }
      listar: (filtros) => api.get('/pedidos', filtros),
      obter: (id) => api.get(`/pedidos/${id}`),
      // { lojaId } | { status: 'ENVIADO', codigoRastreio } | { status: 'ENTREGUE' | 'CANCELADO' }
      atualizar: (id, dados) => api.patch(`/pedidos/${id}`, dados),
    }
