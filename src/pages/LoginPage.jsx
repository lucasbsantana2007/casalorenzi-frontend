import { ArrowLeft } from 'lucide-react'
import { MotionConfig } from 'motion/react'
import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { AuthField } from '../components/auth/AuthField'
import { CheckboxLine } from '../components/auth/CheckboxLine'
import { LoginShowcase } from '../components/auth/LoginShowcase'
import { BrandMark } from '../components/BrandMark'
import { FormError } from '../components/ui/FormError'
import { MODO_DEMO } from '../config/env'
import { CLIENTE_DEMO, PERFIS_DEMO, SENHA_DEMO } from '../context/perfisDemo'
import { useSession } from '../hooks/useSession'
import { destinoPara } from '../utils/destinoLogin'
import { PAPEIS } from '../utils/permissions'

const CONTAS_DEMO = [{ ...CLIENTE_DEMO, rotulo: 'Cliente' }, ...PERFIS_DEMO.map((p) => ({ ...p, rotulo: PAPEIS[p.papel] }))]

// Login único (Iniciar sessão) para clientes e equipe
export function LoginPage() {
  const { usuario, login } = useSession()
  const location = useLocation()
  // Voltando de "Esqueceu a senha?": e-mail já preenchido e aviso de sucesso
  const senhaNova = location.state?.senhaNova
  const [email, setEmail] = useState(location.state?.email ?? '')
  const [senha, setSenha] = useState('')
  const [manterConectado, setManterConectado] = useState(true)
  const [entrando, setEntrando] = useState(false)
  const [error, setError] = useState(null)

  if (usuario) return <Navigate to={destinoPara(usuario, location.state?.from)} replace />

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
    <MotionConfig reducedMotion="user">
      <main className="login">
        <section className="login__panel">
          <div className="login__form-wrap">
            <Link to="/" className="back-link">
              <ArrowLeft size={14} /> Página inicial
            </Link>
            <h1 className="login__brand">
              <BrandMark />
              <span className="login__brand-area">Iniciar sessão</span>
            </h1>

            {senhaNova && (
              <p className="login__sucesso" role="status">
                Senha alterada. Entre com a sua nova senha.
              </p>
            )}

            {MODO_DEMO && !senhaNova && (
              <>
                <div className="login__quick">
                  <span className="login__quick-label">Acesso rápido de demonstração</span>
                  <div className="login__quick-grid login__quick-grid--4">
                    {CONTAS_DEMO.map((conta) => (
                      <button key={conta.id} type="button" className="login__quick-btn" disabled={entrando} onClick={() => acessoRapido(conta)}>
                        <strong>{conta.rotulo}</strong>
                        <span>{conta.nome}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="login__divider">ou entre com seu e-mail</div>
              </>
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

            <div className="login__footer">
              <p>
                Ainda não tem conta?{' '}
                <Link to="/login/criar-conta" state={location.state}>
                  Criar conta
                </Link>
              </p>
              {MODO_DEMO && (
                <p>
                  Demonstração: use o acesso rápido ou a senha <code>{SENHA_DEMO}</code>.
                </p>
              )}
            </div>
          </div>
        </section>

        <LoginShowcase />
      </main>
    </MotionConfig>
  )
}
