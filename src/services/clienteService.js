import { USE_MOCKS } from '../config/env'
import { api } from './api'
import { atendimentoService } from './atendimentoService'
import * as mock from './mock/cliente'

// Portal do cliente. Quando houver autenticação, os endpoints podem usar /clientes/me.
export const clienteService = USE_MOCKS
  ? mock
  : {
      obterPerfil: (clienteId) => api.get(`/clientes/${clienteId}`),
      listarSolicitacoes: (clienteId) => api.get(`/clientes/${clienteId}/atendimentos`),
      obterSolicitacao: (clienteId, id) => api.get(`/clientes/${clienteId}/atendimentos/${id}`),
      // { clienteId, tipoSolicitacaoId, pedidoId?, descricao, anexo? }
      // anexo: { nome, tipo, conteudoBase64 } — uma foto JPG/PNG/WebP de até 2 MB, já reduzida no navegador
      abrirSolicitacao: (dados) => api.post('/atendimentos', dados),
      listarPedidos: (clienteId) => api.get(`/clientes/${clienteId}/pedidos`),
      consultarPedido: (clienteId, numero) => api.get(`/clientes/${clienteId}/pedidos/${encodeURIComponent(numero)}`),
    }

export const responderSolicitacao = (id, clienteId, conteudo) =>
  atendimentoService.enviarMensagem(id, { conteudo, autorId: clienteId, autorTipo: 'CLIENTE' })
