import { USUARIOS } from '../data/seed/pessoas'

// Usuários disponíveis no seletor de perfil da demonstração (um por papel).
// Sai de cena quando houver login real.
export const PERFIS_DEMO = [1, 2, 6].map((id) => USUARIOS.find((u) => u.id === id))
