// Único ponto de leitura das variáveis de ambiente do frontend.
// Valores padrão permitem rodar o projeto sem um arquivo .env.

export const API_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api').replace(/\/+$/, '')

// Enquanto o backend não expõe todas as rotas, os serviços usam a camada de mocks.
// Para consumir a API real, defina VITE_USE_MOCKS=false.
export const USE_MOCKS = (import.meta.env.VITE_USE_MOCKS ?? 'true') !== 'false'

// Modo demonstração: selo "Dados de demonstração" no painel, acesso rápido e dica de senha
// no login. Vale também com a API real, cujo banco é carregado com os mesmos dados de
// demonstração pelo seed. Defina VITE_MODO_DEMO=false quando houver dados reais.
export const MODO_DEMO = (import.meta.env.VITE_MODO_DEMO ?? 'true') !== 'false'
