import { CLIENTES, USUARIOS } from '../data/seed/pessoas'

// Contas de demonstração exibidas no acesso rápido da tela de login.
// Válidas apenas com VITE_USE_MOCKS=true.
export const PERFIS_DEMO = [1, 2, 6].map((id) => USUARIOS.find((u) => u.id === id))

export const CLIENTE_DEMO = CLIENTES.find((c) => c.id === 101)

export const SENHA_DEMO = 'lorenzi2026'
