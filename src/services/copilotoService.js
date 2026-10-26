import { USE_MOCKS } from '../config/env'
import { api, ApiError } from './api'

// Inteligência de Negócios — Assistente IA (backend: src/routers/copiloto.py e alertas.py). Só a equipe.
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
      alertas: semApi,
      atualizarAlerta: semApi,
      executarAutomacoes: semApi,
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
      // { tipo?, status? } -> { alertas, abertosPorTipo, automacoes }
      alertas: (filtros) => api.get('/alertas', filtros),
      // status: RESOLVIDO | DESCARTADO
      atualizarAlerta: (id, status) => api.patch(`/alertas/${id}`, { status }),
      // Só Administrador: roda todas as automações agora
      executarAutomacoes: () => api.post('/automacoes/todas/executar', {}),
    }
