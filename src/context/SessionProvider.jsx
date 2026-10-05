import { useMemo, useState } from 'react'
import { authService } from '../services/authService'
import { getUsuarioSalvo, limparSessao, salvarSessao } from '../services/authStorage'
import { podeAcessar } from '../utils/permissions'
import { SessionContext } from './sessionContext'

const LOGIN_CERTO = {
  cliente: 'Esta é uma conta da equipe. Entre pelo "Acesso da equipe", no rodapé do site.',
  equipe: 'Esta é uma conta de cliente. Entre por "Conta", no topo do site.',
}

// Há dois logins: clientes (/login) e equipe (/login/equipe). O papel da conta
// (CLIENTE, ADMINISTRADOR, LOJISTA, OPERADOR) precisa corresponder ao login usado
// e define as permissões. O token é enviado pela camada de API (Authorization: Bearer).
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
      // area: 'cliente' | 'equipe'
      login: async ({ email, senha, manterConectado, area }) => {
        const sessao = await authService.login({ email, senha })
        if ((sessao.usuario.papel === 'CLIENTE') !== (area === 'cliente')) throw new Error(LOGIN_CERTO[area])
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
