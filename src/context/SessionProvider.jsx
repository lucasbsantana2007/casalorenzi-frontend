import { useMemo, useState } from 'react'
import { CLIENTE_DEMO_ID } from '../data/seed'
import { podeAcessar } from '../utils/permissions'
import { PERFIS_DEMO } from './perfisDemo'
import { SessionContext } from './sessionContext'

const STORAGE_KEY = 'casalorenzi.usuarioId'

function usuarioInicial() {
  try {
    const salvo = Number(localStorage.getItem(STORAGE_KEY))
    return PERFIS_DEMO.find((u) => u.id === salvo) ?? PERFIS_DEMO[0]
  } catch {
    return PERFIS_DEMO[0]
  }
}

// Sessão simulada. Quando houver login real, este provider passa a obter o usuário
// a partir do token (ex.: GET /auth/me) e o restante da aplicação não muda.
export function SessionProvider({ children }) {
  const [usuario, setUsuario] = useState(usuarioInicial)

  const value = useMemo(
    () => ({
      usuario,
      clienteId: CLIENTE_DEMO_ID,
      pode: (modulo) => podeAcessar(usuario.papel, modulo),
      trocarPerfil: (id) => {
        const proximo = PERFIS_DEMO.find((u) => u.id === Number(id))
        if (!proximo) return
        setUsuario(proximo)
        try {
          localStorage.setItem(STORAGE_KEY, String(proximo.id))
        } catch {
          // armazenamento indisponível: o perfil vale só para esta sessão
        }
      },
    }),
    [usuario],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
