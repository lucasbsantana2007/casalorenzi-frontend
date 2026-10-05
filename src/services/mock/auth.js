import { SENHA_DEMO } from '../../context/perfisDemo'
import { db, fail, respond } from './db'

// Mesmo endpoint para equipe e clientes; o papel do usuário define a área de acesso.
export function login({ email, senha }) {
  const usuario = db.usuarios.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
  if (!usuario || senha !== SENHA_DEMO) return fail('E-mail ou senha incorretos.', 401)
  const { id, nome, papel, lojaId = null } = usuario
  return respond({ token: `demo-${id}`, usuario: { id, nome, email: usuario.email, papel, lojaId } })
}
