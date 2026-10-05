import { ArrowLeft } from 'lucide-react'
import { MotionConfig } from 'motion/react'
import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { AuthField } from '../components/auth/AuthField'
import { CheckboxLine } from '../components/auth/CheckboxLine'
import { LoginShowcase } from '../components/auth/LoginShowcase'
import { BrandMark } from '../components/BrandMark'
import { FormError } from '../components/ui/FormError'
import { USE_MOCKS } from '../config/env'
import { CLIENTE_DEMO, PERFIS_DEMO, SENHA_DEMO } from '../context/perfisDemo'
import { useSession } from '../hooks/useSession'
import { PAPEIS } from '../utils/permissions'

// Contas do acesso rápido: uma por tipo de usuário
const CONTAS_DEMO = [{ ...CLIENTE_DEMO, rotulo: 'Cliente' }, ...PERFIS_DEMO.map((p) => ({ ...p, rotulo: PAPEIS[p.papel] }))]

// Destino após o login: a página que levou até aqui (se for da área do usuário) ou a área padrão
function destinoPara(usuario, from) {
  const cliente = usuario.papel === 'CLIENTE'
  if (from && cliente === from.startsWith('/cliente')) return from
  return cliente ? '/cliente' : '/dashboard'
}

// Login único: o tipo da conta (cliente, administrador, lojista, operador) define a área.
export function LoginPage() {
  const { usuario, login } = useSession()
  const location = useLocation()
  const [email, setEmail] = useState('')
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
            <BrandMark />

            <div className="login__heading">
              <h1 className="login__title">Entrar</h1>
              <p className="muted">Use seu e-mail e senha. Você será levado direto para a sua área.</p>
            </div>

            {USE_MOCKS && (
              <>
                <div className="login__quick">
                  <span className="login__quick-label">Acesso rápido de demonstração</span>
                  <div className="login__quick-grid">
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

              <CheckboxLine checked={manterConectado} onChange={setManterConectado}>
                Manter conectado neste dispositivo
              </CheckboxLine>

              <FormError error={error} />

              <button type="submit" className="login__submit" disabled={entrando}>
                {entrando ? 'Entrando…' : 'Entrar'}
              </button>
            </form>

            <div className="login__footer">
              <p>Esqueceu a senha? Fale com a sua loja Casa Lorenzi.</p>
              {USE_MOCKS && (
                <p>
                  Demonstração: use o acesso rápido ou qualquer e-mail cadastrado com a senha <code>{SENHA_DEMO}</code>.
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
