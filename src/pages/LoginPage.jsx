import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { AuthField } from '../components/auth/AuthField'
import { CheckboxLine } from '../components/auth/CheckboxLine'
import { LayoutAcesso } from '../components/auth/LayoutAcesso'
import { FormError } from '../components/ui/FormError'
import { MODO_DEMO } from '../config/env'
import { CLIENTE_DEMO, PERFIS_DEMO, SENHA_DEMO } from '../context/perfisDemo'
import { useSession } from '../hooks/useSession'
import { destinoPara } from '../utils/destinoLogin'
import { PAPEIS } from '../utils/permissions'

const CONTAS_DEMO = [{ ...CLIENTE_DEMO, rotulo: 'Cliente' }, ...PERFIS_DEMO.map((p) => ({ ...p, rotulo: PAPEIS[p.papel] }))]

// Login único (Iniciar sessão) para clientes e equipe
export function LoginPage() {
  const { usuario, login, logout } = useSession()
  const location = useLocation()
  // Vindo da exclusão da conta: encerra aqui a sessão (a conta já não existe) e mostra o aviso
  const contaExcluida = location.state?.contaExcluida
  useEffect(() => {
    if (contaExcluida && usuario) logout()
  }, [contaExcluida, usuario, logout])
  // Voltando de "Esqueceu a senha?": e-mail já preenchido e aviso de sucesso
  const senhaNova = location.state?.senhaNova
  // Sessão vencida (src/services/api.js): aviso e, depois de entrar, volta à página em que estava
  const consulta = new URLSearchParams(location.search)
  const sessaoExpirada = consulta.get('sessao') === 'expirada'
  const volta = consulta.get('volta')
  // Só caminhos do próprio site ("/..."), nunca outro endereço ("//site.com")
  const voltarPara = location.state?.from ?? (volta?.startsWith('/') && !volta.startsWith('//') ? volta : undefined)
  const [email, setEmail] = useState(location.state?.email ?? '')
  const [senha, setSenha] = useState('')
  const [manterConectado, setManterConectado] = useState(true)
  const [entrando, setEntrando] = useState(false)
  const [error, setError] = useState(null)

  if (usuario && !contaExcluida) return <Navigate to={destinoPara(usuario, voltarPara)} replace />

  async function entrar(credenciais) {
    setError(null)
    setEntrando(true)
    try {
      await login({ ...credenciais, manterConectado })
    } catch (err) {
      setError(err)
      setEntrando(false)
    }
  }

  function acessoRapido(conta) {
    setEmail(conta.email)
    setSenha(SENHA_DEMO)
    entrar({ email: conta.email, senha: SENHA_DEMO })
  }

  return (
    <LayoutAcesso titulo="Entrar" subtitulo="Acompanhe seus pedidos, trocas e solicitações." voltar={{ to: '/', label: 'Página inicial' }}>
      {contaExcluida && (
        <p className="login__sucesso" role="status">
          Sua conta foi excluída e seus dados pessoais foram apagados.
        </p>
      )}
      {sessaoExpirada && !senhaNova && (
        <p className="login__sucesso" role="status">
          Sua sessão expirou. Entre novamente para continuar.
        </p>
      )}
      {senhaNova && (
        <p className="login__sucesso" role="status">
          Senha alterada. Entre com a sua nova senha.
        </p>
      )}

      <form
        className="login__form"
        onSubmit={(event) => {
          event.preventDefault()
          entrar({ email, senha })
        }}
      >
        <AuthField label="E-mail" type="email" value={email} onChange={setEmail} placeholder="seu@email.com" autoComplete="username" required />
        <AuthField label="Senha" type="password" value={senha} onChange={setSenha} placeholder="Digite sua senha" autoComplete="current-password" required />

        <Link to="/login/esqueci-senha" className="login__esqueci">
          Esqueceu a senha?
        </Link>

        <CheckboxLine checked={manterConectado} onChange={setManterConectado}>
          Manter conectado neste dispositivo
        </CheckboxLine>

        <FormError error={error} />

        <button type="submit" className="login__submit" disabled={entrando}>
          {entrando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <p className="acesso__alternativa">
        Ainda não tem conta?{' '}
        <Link to="/login/criar-conta" state={location.state}>
          Criar conta
        </Link>
      </p>

      {MODO_DEMO && (
        <details className="login__demo">
          <summary>Acesso de demonstração</summary>
          <div className="login__quick-grid login__quick-grid--4">
            {CONTAS_DEMO.map((conta) => (
              <button key={conta.id} type="button" className="login__quick-btn" disabled={entrando} onClick={() => acessoRapido(conta)}>
                <strong>{conta.rotulo}</strong>
                <span>{conta.nome}</span>
              </button>
            ))}
          </div>
          <p>
            Ou entre com qualquer conta de demonstração e a senha <code>{SENHA_DEMO}</code>.
          </p>
        </details>
      )}
    </LayoutAcesso>
  )
}
