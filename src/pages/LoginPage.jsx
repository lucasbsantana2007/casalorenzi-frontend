import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { AuthField } from '../components/auth/AuthField'
import { CheckboxLine } from '../components/auth/CheckboxLine'
import { LayoutAcesso } from '../components/auth/LayoutAcesso'
import { FormError } from '../components/ui/FormError'
import { MODO_DEMO } from '../config/env'
import { inicioDaMarca, loginDaMarca } from '../data/marcas'
import { useMarca } from '../hooks/useMarca'
import { ACESSO_DEMO, CLIENTE_DEMO, SENHA_DEMO } from '../context/perfisDemo'
import { useSession } from '../hooks/useSession'
import { destinoPara } from '../utils/destinoLogin'
import { PAPEIS } from '../utils/permissions'

// A equipe da marca da página e, nas duas, a cliente de demonstração
const gruposDemo = (marca) => [...ACESSO_DEMO[marca], { titulo: 'Cliente', contas: [CLIENTE_DEMO] }]

// Login único (Iniciar sessão) para clientes e equipe, em /login (Casa Lorenzi) e /vulto/login (Vulto).
// Os dois entram na mesma conta e levam ao mesmo lugar: cliente → /cliente, equipe → /dashboard.
export function LoginPage() {
  const { usuario, login, logout } = useSession()
  const marca = useMarca()
  const vulto = marca.id === 'VULTO'
  const location = useLocation()
  // Vindo da exclusão da conta, de "Esqueceu a senha?" ou do convite: a sessão que já estava aberta é de
  // outra pessoa (ou de uma conta que não existe mais). Encerra só ela; quem entrar daqui segue normal
  const contaExcluida = location.state?.contaExcluida
  const senhaNova = location.state?.senhaNova
  const [sessaoAntiga] = useState(() => ((contaExcluida || senhaNova) && usuario ? usuario.id : null))
  useEffect(() => {
    if (sessaoAntiga !== null) logout()
  }, [sessaoAntiga, logout])
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

  if (usuario && usuario.id !== sessaoAntiga) return <Navigate to={destinoPara(usuario, voltarPara)} replace />

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
    <LayoutAcesso
      titulo="Entrar"
      subtitulo={vulto ? 'Seus pedidos, trocas e pontos Vulto+.' : 'Acompanhe seus pedidos, trocas e solicitações.'}
      voltar={{ to: inicioDaMarca(marca), label: 'Página inicial' }}
    >
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
        <AuthField label="E-mail ou CPF" type="text" value={email} onChange={setEmail} placeholder="seu@email.com ou 000.000.000-00" autoComplete="username" required />
        <AuthField label="Senha" type="password" value={senha} onChange={setSenha} placeholder="Digite sua senha" autoComplete="current-password" required />

        <Link to={loginDaMarca(marca, '/esqueci-senha')} className="login__esqueci">
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
        <Link to={loginDaMarca(marca, '/criar-conta')} state={location.state}>
          Criar conta
        </Link>
      </p>

      {vulto && <p className="acesso__equipe">Equipe da Vulto: entre com o seu e-mail. O painel de gestão é o mesmo das duas marcas, e cada um vê a marca em que trabalha.</p>}

      {MODO_DEMO && (
        <details className="login__demo">
          <summary>Acesso de demonstração</summary>
          {gruposDemo(marca.id).map((grupo) => (
            <div key={grupo.titulo} className="login__demo-grupo">
              <span className="login__demo-titulo">{grupo.titulo}</span>
              <div className={`login__quick-grid${grupo.contas.length === 1 ? ' login__quick-grid--1' : ''}`}>
                {grupo.contas.map((conta) => (
                  <button key={conta.id} type="button" className="login__quick-btn" disabled={entrando} onClick={() => acessoRapido(conta)}>
                    <strong>{PAPEIS[conta.papel] ?? 'Cliente'}</strong>
                    <span>{conta.nome}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          <p>
            Ou entre com qualquer conta de demonstração e a senha <code>{SENHA_DEMO}</code>.
          </p>
        </details>
      )}
    </LayoutAcesso>
  )
}
