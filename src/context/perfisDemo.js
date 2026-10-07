import { CLIENTES, USUARIOS } from '../data/seed/pessoas'

// Contas de demonstração exibidas no acesso rápido da tela de login.
// Exibidas com VITE_MODO_DEMO=true (as mesmas contas existem no seed do backend).
export const PERFIS_DEMO = [1, 2, 6].map((id) => USUARIOS.find((u) => u.id === id))

export const CLIENTE_DEMO = CLIENTES[0]

export const SENHA_DEMO = 'lorenzi2026'

// PIN de "Meus pedidos" dos clientes de demonstração (compras antigas, feitas antes do PIN existir)
export const PIN_DEMO = '1234'
