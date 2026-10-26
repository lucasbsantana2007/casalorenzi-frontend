import { API_URL } from '../config/env'
import { getToken, limparSessao } from './authStorage'
import { marcaEscolhida } from './marcaPainel'

// Cliente HTTP central. Nenhum componente deve chamar fetch diretamente:
// os serviços de domínio (src/services/*Service.js) usam este módulo.

export class ApiError extends Error {
  constructor(message, { status = 0, details = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

function buildUrl(path, params) {
  const url = new URL(`${API_URL}${path}`)
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value)
    }
  })
  return url
}

// FastAPI devolve erros como { detail: string } ou { detail: [{ msg, loc }] }
function extractMessage(body, status) {
  const detail = body?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg
  return `A requisição falhou (HTTP ${status}).`
}

async function request(path, { method = 'GET', params, body, headers: extras } = {}) {
  const headers = { Accept: 'application/json', ...extras }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  // Seletor de marca do Administrador do grupo (a API ignora para quem é de uma marca só)
  const marca = marcaEscolhida()
  if (token && marca) headers['X-Marca'] = marca
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let response
  try {
    response = await fetch(buildUrl(path, params), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(`Não foi possível conectar à API (${API_URL}).`)
  }

  // Token vencido (o login vale 2 horas): encerra a sessão e volta ao login, que avisa e depois
  // devolve a pessoa para a página em que estava
  if (response.status === 401 && token && !path.startsWith('/auth/login')) {
    limparSessao()
    const volta = encodeURIComponent(window.location.pathname + window.location.search)
    window.location.assign(`/login?sessao=expirada&volta=${volta}`)
  }

  if (response.status === 204) return null
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError(extractMessage(data, response.status), { status: response.status, details: data })
  }
  return data
}

// opcoes.headers: cabeçalhos extras da chamada (ex.: X-Conversa-Chave do assistente do site)
export const api = {
  get: (path, params, opcoes) => request(path, { params, ...opcoes }),
  post: (path, body, opcoes) => request(path, { method: 'POST', body, ...opcoes }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
}
