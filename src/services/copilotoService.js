import { USE_MOCKS } from '../config/env'
import { api, ApiError } from './api'

// Inteligência de Negócios — Assistente IA (backend: src/routers/copiloto.py e alertas.py, com as automações). Só a equipe.
// Cada consulta confere no backend o módulo do assunto e a marca do token (o seletor do grupo vai em X-Marca).

const semApi = () =>
  Promise.reject(new ApiError('A Inteligência de Negócios precisa da API conectada (defina VITE_USE_MOCKS=false).', { status: 503 }))

export const copilotoService = USE_MOCKS
  ? {
      sugestoes: semApi,
      conversas: semApi,
      abrir: semApi,
      obter: semApi,
      perguntar: semApi,
      uso: semApi,
      emailsAutomaticos: semApi,
      executarAutomacoes: semApi,
      tokensMcp: semApi,
      criarTokenMcp: semApi,
      revogarTokenMcp: semApi,
    }
  : {
      sugestoes: () => api.get('/copiloto/sugestoes'),
      conversas: () => api.get('/copiloto/conversas'),
      abrir: () => api.post('/copiloto/conversas', {}),
      obter: (id) => api.get(`/copiloto/conversas/${id}`),
      // { texto, idCliente } -> { pergunta, resposta }
      perguntar: (id, dados) => api.post(`/copiloto/conversas/${id}/mensagens`, dados),
      // Só Administrador: uso dos assistentes, tokens e custo estimado
      uso: (dias = 30) => api.get('/copiloto/uso', { dias }),
      // Só Administrador, aba Automações (decisão 127): -> { resend, emails, rotinas, envios }
      emailsAutomaticos: () => api.get('/automacoes/emails'),
      // Só Administrador: roda todas as automações agora (os e-mails e as rotinas internas)
      executarAutomacoes: () => api.post('/automacoes/todas/executar', {}),
      // Conectar ao Claude (servidor MCP, decisão 106): os tokens da pessoa logada
      tokensMcp: () => api.get('/mcp/tokens'),
      // -> { ...token, token } (o texto do token só vem nesta resposta)
      criarTokenMcp: (nome) => api.post('/mcp/tokens', { nome }),
      revogarTokenMcp: (id) => api.delete(`/mcp/tokens/${id}`),
    }
