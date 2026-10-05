// Único ponto de leitura das variáveis de ambiente do frontend.
// Valores padrão permitem rodar o projeto sem um arquivo .env.

export const API_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '')

// Enquanto o backend não expõe todas as rotas, os serviços usam a camada de mocks.
// Para consumir a API real, defina VITE_USE_MOCKS=false.
export const USE_MOCKS = (import.meta.env.VITE_USE_MOCKS ?? 'true') !== 'false'
