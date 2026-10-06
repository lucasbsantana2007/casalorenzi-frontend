import { USE_MOCKS } from '../config/env'
import { api } from './api'
import * as mock from './mock/pedidos'

// Pedidos do e-commerce: checkout público, consulta pelo código e gestão no painel.
export const pedidosService = USE_MOCKS
  ? mock
  : {
      // Loja (público, sem login)
      // { email, emailConfirmacao, pin, pinConfirmacao, nome, telefone, endereco, freteTipo, pagamento: { metodo, parcelas }, itens: [{ variacaoId, quantidade }] }
      finalizarCompra: (dados) => api.post('/checkout', dados),
      // { email, pin } → todos os pedidos do e-mail. POST para o PIN não ir na URL
      listarMeusPedidos: (dados) => api.post('/meus-pedidos', dados),
      // { email } → envia e-mail com link de confirmação (resposta igual exista ou não o e-mail)
      solicitarNovoPin: (dados) => api.post('/meus-pedidos/esqueci-pin', dados),
      // { token, pin, pinConfirmacao } → { email }
      redefinirPin: (dados) => api.post('/meus-pedidos/redefinir-pin', dados),
      // { email, pin } → chamados do e-mail com a conversa
      // Cada mensagem traz `anexo: { id, nome, tipo, url } | null`; `url` é um data URL pronto para <img src>
      listarMinhasSolicitacoes: (dados) => api.post('/meus-pedidos/solicitacoes/consulta', dados),
      // { email, pin, id, conteudo } → chamado atualizado
      responderSolicitacao: ({ id, ...dados }) => api.post(`/meus-pedidos/solicitacoes/${id}/mensagens`, dados),
      // { numero, email, pin, tipoSolicitacaoId, descricao, anexo? } → { id, protocolo, tipo }
      // anexo (opcional): { nome, tipo, conteudoBase64 } — tipo image/jpeg, image/png ou image/webp;
      // no máximo 2 MB depois de decodificado. A loja já reduz a foto no navegador antes de enviar
      abrirSolicitacao: (dados) => api.post('/meus-pedidos/solicitacoes', dados),

      // Painel (equipe)
      // filtros: { status, lojaId, canal, busca }
      listar: (filtros) => api.get('/pedidos', filtros),
      obter: (id) => api.get(`/pedidos/${id}`),
      // { lojaId } | { status: 'ENVIADO', codigoRastreio } | { status: 'ENTREGUE' | 'CANCELADO' }
      atualizar: (id, dados) => api.patch(`/pedidos/${id}`, dados),
    }
