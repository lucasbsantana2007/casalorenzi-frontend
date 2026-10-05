import { useMemo, useState } from 'react'
import { authService } from '../services/authService'
import { getUsuarioSalvo, limparSessao, salvarSessao } from '../services/authStorage'
import { podeAcessar } from '../utils/permissions'
import { SessionContext } from './sessionContext'

// Login único para clientes e equipe: o papel da conta (CLIENTE, ADMINISTRADOR,
// LOJISTA, OPERADOR) define a área e as permissões. O token é enviado pela camada
// de API em todas as requisições (Authorization: Bearer).
export function SessionProvider({ children }) {
  const [usuario, setUsuario] = useState(getUsuarioSalvo)

  const value = useMemo(() => {
    const isCliente = usuario?.papel === 'CLIENTE'
    return {
      usuario,
      isCliente,
      isEquipe: Boolean(usuario) && !isCliente,
      clienteId: isCliente ? usuario.id : null,
      pode: (modulo) => Boolean(usuario) && podeAcessar(usuario.papel, modulo),
      login: async ({ email, senha, manterConectado }) => {
        const sessao = await authService.login({ email, senha })
        salvarSessao(sessao, manterConectado)
        setUsuario(sessao.usuario)
      },
      logout: () => {
        limparSessao()
        setUsuario(null)
      },
    }
  }, [usuario])

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
