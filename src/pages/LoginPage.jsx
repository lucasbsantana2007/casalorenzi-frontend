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
import { PAPEIS } from '../utils/permissions'

// Dois logins com a mesma tela: clientes (/login) e equipe (/login/equipe)
const AREAS = {
  cliente: {
    titulo: 'Entrar',
    descricao: 'Acesse sua conta para acompanhar pedidos e atendimentos.',
    placeholder: 'seu@email.com',
    contas: [{ ...CLIENTE_DEMO, rotulo: 'Cliente' }],
    esqueceu: 'Esqueceu a senha? Fale com a sua loja Casa Lorenzi.',
  },
  equipe: {
    titulo: 'Acesso da equipe',
    descricao: 'Painel de gestão para administradores, lojistas e operadores.',
    placeholder: 'nome@casalorenzi.com.br',
    contas: PERFIS_DEMO.map((p) => ({ ...p, rotulo: PAPEIS[p.papel] })),
    esqueceu: 'Esqueceu a senha? Fale com o administrador da sua loja.',
  },
}

export const LoginClientePage = () => <LoginPage area="cliente" />
export const LoginEquipePage = () => <LoginPage area="equipe" />

// Destino após o login: a página que levou até aqui (se for da área do usuário) ou a área padrão
function destinoPara(usuario, from) {
  const cliente = usuario.papel === 'CLIENTE'
  if (from && cliente === from.startsWith('/cliente')) return from
  return cliente ? '/cliente' : '/dashboard'
}

function LoginPage({ area }) {
  const config = AREAS[area]
  const { usuario, login, logout } = useSession()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [manterConectado, setManterConectado] = useState(true)
  const [entrando, setEntrando] = useState(false)
  const [error, setError] = useState(null)

  // Sessão ativa da mesma área: vai direto para ela. Da outra área (ex.: cliente logado
  // abrindo o login da equipe): mostra a tela com um aviso, em vez de redirecionar em silêncio.
  const sessaoDeOutraArea = usuario && (usuario.papel === 'CLIENTE') !== (area === 'cliente')
  if (usuario && !sessaoDeOutraArea) return <Navigate to={destinoPara(usuario, location.state?.from)} replace />

  async function entrar(credenciais) {
    setError(null)
    setEntrando(true)
    try {
      await login({ ...credenciais, manterConectado, area })
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
              <h1 className="login__title">{config.titulo}</h1>
              <p className="muted">{config.descricao}</p>
            </div>

            {sessaoDeOutraArea ? (
              <div className="login__session" role="status">
                <p>
                  Você está conectado como <strong>{usuario.nome}</strong> ({usuario.papel === 'CLIENTE' ? 'cliente' : PAPEIS[usuario.papel]}). Para entrar com
                  outra conta, saia primeiro.
                </p>
                <div className="login__session-actions">
                  <Link to={usuario.papel === 'CLIENTE' ? '/cliente' : '/dashboard'} className="btn btn-secondary">
                    Ir para minha área
                  </Link>
                  <button type="button" className="btn btn-primary" onClick={logout}>
                    Sair e trocar de conta
                  </button>
                </div>
              </div>
            ) : (
              <>
              {MODO_DEMO && (
                <>
                  <div className="login__quick">
                    <span className="login__quick-label">Acesso rápido de demonstração</span>
                    <div className={`login__quick-grid login__quick-grid--${config.contas.length}`}>
                      {config.contas.map((conta) => (
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
              <AuthField label="E-mail" type="email" value={email} onChange={setEmail} placeholder={config.placeholder} autoComplete="username" required />
              <AuthField label="Senha" type="password" value={senha} onChange={setSenha} placeholder="Digite sua senha" autoComplete="current-password" required />

              <CheckboxLine checked={manterConectado} onChange={setManterConectado}>
                Manter conectado neste dispositivo
              </CheckboxLine>

              <FormError error={error} />

              <button type="submit" className="login__submit" disabled={entrando}>
                {entrando ? 'Entrando…' : 'Entrar'}
              </button>
            </form>
              </>
            )}

            <div className="login__footer">
              <p>{config.esqueceu}</p>
              {MODO_DEMO && (
                <p>
                  Demonstração: use o acesso rápido ou a senha <code>{SENHA_DEMO}</code>.
                </p>
              )}
            </div>
          </div>
        </section>

        <LoginShowcase area={area} />
      </main>
    </MotionConfig>
  )
}
