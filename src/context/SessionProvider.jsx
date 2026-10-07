import { useMemo, useState } from 'react'
import { authService } from '../services/authService'
import { getUsuarioSalvo, limparSessao, salvarSessao } from '../services/authStorage'
import { podeAcessar } from '../utils/permissions'
import { SessionContext } from './sessionContext'

// Um único login (/login) para clientes e equipe. O papel da conta (CLIENTE, ADMINISTRADOR,
// LOJISTA, OPERADOR) define para onde a pessoa vai e o que pode acessar.
// O token é enviado pela camada de API (Authorization: Bearer).
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
      // somenteCliente: no checkout, só conta de cliente compra
      login: async ({ email, senha, manterConectado, somenteCliente = false }) => {
        const sessao = await authService.login({ email, senha })
        if (somenteCliente && sessao.usuario.papel !== 'CLIENTE') {
          throw new Error('Esta é uma conta da equipe. Para comprar, use uma conta de cliente.')
        }
        salvarSessao(sessao, manterConectado)
        setUsuario(sessao.usuario)
        return sessao.usuario
      },
      // Cadastro de cliente (checkout): cria a conta e já entra nela
      cadastrar: async (dados) => {
        const sessao = await authService.cadastrarCliente(dados)
        salvarSessao(sessao, true)
        setUsuario(sessao.usuario)
        return sessao.usuario
      },
      logout: () => {
        limparSessao()
        setUsuario(null)
      },
    }
  }, [usuario])

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
