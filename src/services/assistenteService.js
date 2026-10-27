import { USE_MOCKS } from '../config/env'
import { api, ApiError } from './api'

// Assistente do site (backend: src/routers/assistente.py). A conversa sem login é de quem tem a chave,
// mandada em X-Conversa-Chave; com login de cliente, é da conta. A chave da API do modelo nunca passa pelo
// navegador: o frontend só fala com a nossa API.

const semApi = () =>
  Promise.reject(new ApiError('O assistente precisa da API conectada (defina VITE_USE_MOCKS=false).', { status: 503 }))

const comChave = (chave) => ({ headers: chave ? { 'X-Conversa-Chave': chave } : {} })

export const assistenteService = USE_MOCKS
  ? { abrir: semApi, obter: semApi, enviar: semApi, registrarSacola: semApi, encaminhar: semApi, encerrar: semApi }
  : {
      // { id, chave, mensagens: [...] }
      abrir: (marca) => api.post('/assistente/conversas', { marca }),
      obter: (id, chave) => api.get(`/assistente/conversas/${id}`, undefined, comChave(chave)),
      // { texto, idCliente, acao? } -> { pergunta, resposta, status }
      enviar: (id, chave, dados) => api.post(`/assistente/conversas/${id}/mensagens`, dados, comChave(chave)),
      registrarSacola: (id, chave, mensagemId, variacaoId) =>
        api.post(`/assistente/conversas/${id}/eventos`, { tipo: 'SACOLA_ADICIONADA', mensagemId, variacaoId }, comChave(chave)),
      // Abre um chamado de atendimento -> { atendimentoId, protocolo, link, whatsappUrl }. canal SITE exige login
      // de cliente; WHATSAPP não, e devolve o link wa.me com o protocolo
      encaminhar: (id, chave, motivo, canal = 'SITE') =>
        api.post(`/assistente/conversas/${id}/atendimento`, { motivo, canal }, comChave(chave)),
      encerrar: (id, chave) => api.post(`/assistente/conversas/${id}/encerrar`, {}, comChave(chave)),
    }
