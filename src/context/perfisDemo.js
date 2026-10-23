import { CLIENTES, USUARIOS } from '../data/seed/pessoas'

const usuario = (id) => USUARIOS.find((u) => u.id === id)

// Acesso rápido da tela de login (exibido com VITE_MODO_DEMO=true), com as mesmas contas do seed do backend.
// Cada página mostra a equipe da sua marca, na hierarquia do painel: em /login, a Administradora do grupo
// (Helena, vê as duas marcas) e a equipe da Casa Lorenzi; em /vulto/login, a equipe da Vulto. Cada um da
// equipe de uma marca só vê e altera a marca dele
export const ACESSO_DEMO = {
  LORENZI: [
    { titulo: 'ADM geral · as duas marcas', contas: [usuario(1)] },
    { titulo: 'Equipe Casa Lorenzi', contas: [12, 2, 6].map(usuario) },
  ],
  VULTO: [{ titulo: 'Equipe Vulto', contas: [9, 10, 11].map(usuario) }],
}

export const CLIENTE_DEMO = CLIENTES[0]

export const SENHA_DEMO = 'lorenzi2026'
