import { ArrowLeft, MailCheck } from 'lucide-react'
import { MotionConfig } from 'motion/react'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthField } from '../components/auth/AuthField'
import { LoginShowcase } from '../components/auth/LoginShowcase'
import { BrandMark } from '../components/BrandMark'
import { FormError } from '../components/ui/FormError'
import { authService } from '../services/authService'

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SENHA_MINIMA = 8

// Mesmo visual do login: formulário à esquerda, frase à direita
function LayoutSenha({ titulo, children }) {
  return (
    <MotionConfig reducedMotion="user">
      <main className="login">
        <section className="login__panel">
          <div className="login__form-wrap">
            <Link to="/login" className="back-link">
              <ArrowLeft size={14} /> Iniciar sessão
            </Link>
            <h1 className="login__brand">
              <BrandMark />
              <span className="login__brand-area">{titulo}</span>
            </h1>
            {children}
          </div>
        </section>
        <LoginShowcase />
      </main>
    </MotionConfig>
  )
}

// Passo 1: pede o e-mail e envia o link para criar a senha nova
export function EsqueciSenhaPage() {
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(null)
  const [erro, setErro] = useState(null)

  const enviar = async (e) => {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      setEnviado(await authService.solicitarNovaSenha({ email: email.trim() }))
    } catch (error) {
      setErro(error)
    } finally {
      setEnviando(false)
    }
  }

  if (enviado) {
    return (
      <LayoutSenha titulo="Nova senha">
        <div className="login__aviso" role="status">
          <MailCheck size={22} strokeWidth={1.5} aria-hidden="true" />
          <p>
            Se houver uma conta com <strong>{email.trim()}</strong>, enviamos um link para criar uma nova senha. Ele vale por 30 minutos.
          </p>
        </div>
        {enviado.linkDemo && (
          <div className="login__demo-link">
            <p>Demonstração: o e-mail não é enviado de verdade. Abra o link por aqui.</p>
            <Link to={enviado.linkDemo} className="login__submit login__submit--link">
              Abrir link do e-mail
            </Link>
          </div>
        )}
        <div className="login__footer">
          <p>
            Não recebeu?{' '}
            <button type="button" className="login__text-btn" onClick={() => setEnviado(null)}>
              Tentar outro e-mail
            </button>
          </p>
        </div>
      </LayoutSenha>
    )
  }

  return (
    <LayoutSenha titulo="Nova senha">
      <p className="login__intro">Informe o e-mail da sua conta. Vamos enviar um link para você criar uma nova senha.</p>
      <form className="login__form" onSubmit={enviar}>
        <AuthField label="E-mail" type="email" value={email} onChange={setEmail} placeholder="seu@email.com" autoComplete="email" autoFocus required />
        <FormError error={erro} />
        <button type="submit" className="login__submit" disabled={enviando || !EMAIL_VALIDO.test(email.trim())}>
          {enviando ? 'Enviando…' : 'Enviar link'}
        </button>
      </form>
    </LayoutSenha>
  )
}

// Passo 2: aberta pelo link do e-mail, define a senha nova e volta ao login
export function NovaSenhaPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') ?? ''
  const [senha, setSenha] = useState('')
  const [senhaConfirmacao, setSenhaConfirmacao] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState(null)
  const curta = senha.length > 0 && senha.length < SENHA_MINIMA
  const diferentes = senhaConfirmacao.length > 0 && senha !== senhaConfirmacao

  const salvar = async (e) => {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      const { email } = await authService.redefinirSenha({ token, senha, senhaConfirmacao })
      // E-mail vai no state da navegação, não na URL (não fica no histórico)
      navigate('/login', { replace: true, state: { senhaNova: true, email } })
    } catch (error) {
      setErro(error)
      setEnviando(false)
    }
  }

  if (!token) {
    return (
      <LayoutSenha titulo="Link inválido">
        <p className="login__intro">Este link não é válido. Peça um novo para criar a sua senha.</p>
        <Link to="/login/esqueci-senha" className="login__submit login__submit--link">
          Pedir novo link
        </Link>
      </LayoutSenha>
    )
  }

  return (
    <LayoutSenha titulo="Nova senha">
      <p className="login__intro">Crie uma nova senha para a sua conta. Ela substitui a anterior.</p>
      <form className="login__form" onSubmit={salvar}>
        <AuthField label="Nova senha" type="password" value={senha} onChange={setSenha} placeholder={`Mínimo de ${SENHA_MINIMA} caracteres`} autoComplete="new-password" autoFocus required />
        {curta && <small className="login__erro">A senha deve ter pelo menos {SENHA_MINIMA} caracteres.</small>}
        <AuthField label="Confirme a nova senha" type="password" value={senhaConfirmacao} onChange={setSenhaConfirmacao} autoComplete="new-password" onPaste={(e) => e.preventDefault()} required />
        {diferentes && <small className="login__erro">As senhas não conferem.</small>}
        <FormError error={erro} />
        <button type="submit" className="login__submit" disabled={enviando || senha.length < SENHA_MINIMA || senha !== senhaConfirmacao}>
          {enviando ? 'Salvando…' : 'Salvar nova senha'}
        </button>
      </form>
      {erro?.status === 410 && (
        <p className="login__footer">
          <Link to="/login/esqueci-senha">Pedir novo link</Link>
        </p>
      )}
    </LayoutSenha>
  )
}
