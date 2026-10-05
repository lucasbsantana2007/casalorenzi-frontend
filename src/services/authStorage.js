// Guarda token e usuário da sessão. "Manter conectado" usa localStorage;
// caso contrário, sessionStorage (a sessão termina ao fechar o navegador).
const TOKEN_KEY = 'casalorenzi.token'
const USUARIO_KEY = 'casalorenzi.usuario'

function safe(fn, fallback = null) {
  try {
    return fn()
  } catch {
    return fallback
  }
}

const ler = (key) => safe(() => localStorage.getItem(key) ?? sessionStorage.getItem(key))

export const getToken = () => ler(TOKEN_KEY)

export function getUsuarioSalvo() {
  if (!getToken()) return null
  return safe(() => JSON.parse(ler(USUARIO_KEY)))
}

export function salvarSessao({ token, usuario }, manterConectado) {
  limparSessao()
  const storage = manterConectado ? localStorage : sessionStorage
  safe(() => {
    storage.setItem(TOKEN_KEY, token)
    storage.setItem(USUARIO_KEY, JSON.stringify(usuario))
  })
}

export function limparSessao() {
  safe(() => {
    ;[localStorage, sessionStorage].forEach((storage) => {
      storage.removeItem(TOKEN_KEY)
      storage.removeItem(USUARIO_KEY)
    })
  })
}
