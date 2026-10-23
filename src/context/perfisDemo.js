import { USE_MOCKS } from '../config/env'
import { CLIENTES, USUARIOS } from '../data/seed/pessoas'

// Contas de demonstração exibidas no acesso rápido da tela de login.
// Exibidas com VITE_MODO_DEMO=true (as mesmas contas existem no seed do backend).
// Helena (grupo, as duas marcas), Rafael e Diego (Casa Lorenzi). Paula e Lia (Vulto) só existem nos dados de
// demonstração do navegador: com a API real (produção), a equipe da Vulto é cadastrada pela central
export const PERFIS_DEMO = (USE_MOCKS ? [1, 2, 6, 9, 10] : [1, 2, 6]).map((id) => USUARIOS.find((u) => u.id === id))

export const CLIENTE_DEMO = CLIENTES[0]

export const SENHA_DEMO = 'lorenzi2026'
