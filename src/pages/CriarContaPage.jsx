import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { AuthField } from '../components/auth/AuthField'
import { LayoutAcesso } from '../components/auth/LayoutAcesso'
import { FormError } from '../components/ui/FormError'
import { useSession } from '../hooks/useSession'
import { cpfValido, formatarCpf, somenteDigitosCpf } from '../utils/cpf'
import { destinoPara } from '../utils/destinoLogin'

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SENHA_MINIMA = 8

// Cadastro do cliente pelo login: os mesmos dados pedidos no checkout. Depois, já entra na conta.
export function CriarContaPage() {
  const { usuario, cadastrar } = useSession()
  const location = useLocation()
  const [conta, setConta] = useState({ nome: '', cpf: '', email: '', telefone: '', senha: '', senhaConfirmacao: '' })
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState(null)

  if (usuario) return <Navigate to={destinoPara(usuario, location.state?.from)} replace />

  const atualizar = (campo) => (valor) => setConta((c) => ({ ...c, [campo]: valor }))
  const emailInvalido = conta.email.length > 0 && !EMAIL_VALIDO.test(conta.email.trim())
  const cpfInvalido = somenteDigitosCpf(conta.cpf).length === 11 && !cpfValido(conta.cpf)
  const senhaCurta = conta.senha.length > 0 && conta.senha.length < SENHA_MINIMA
  const senhasDiferentes = conta.senhaConfirmacao.length > 0 && conta.senha !== conta.senhaConfirmacao
  const pronta =
    conta.nome.trim().length > 0 &&
    cpfValido(conta.cpf) &&
    EMAIL_VALIDO.test(conta.email.trim()) &&
    conta.senha.length >= SENHA_MINIMA &&
    conta.senha === conta.senhaConfirmacao

  const criar = async (e) => {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      // Com a sessão criada, o <Navigate> acima leva para o perfil (ou para a página que pediu login)
      await cadastrar({ ...conta, cpf: somenteDigitosCpf(conta.cpf) })
    } catch (error) {
      setErro(error)
      setEnviando(false)
    }
  }

  return (
    <LayoutAcesso titulo="Criar conta" subtitulo="Com a sua conta você acompanha pedidos, trocas e solicitações.">
      <form className="login__form" onSubmit={criar} noValidate>
        <AuthField label="Nome completo" value={conta.nome} onChange={atualizar('nome')} autoComplete="name" autoFocus required />
        <div className="login__grid">
          <div className="login__campo">
            <AuthField
              label="CPF"
              value={conta.cpf}
              onChange={(valor) => setConta((c) => ({ ...c, cpf: formatarCpf(valor) }))}
              inputMode="numeric"
              placeholder="000.000.000-00"
              aria-invalid={cpfInvalido}
              required
            />
            {cpfInvalido && <small className="login__erro">CPF inválido.</small>}
          </div>
          <AuthField label="Celular" type="tel" value={conta.telefone} onChange={atualizar('telefone')} autoComplete="tel" placeholder="(11) 90000-0000" />
        </div>
        <div className="login__campo">
          <AuthField label="E-mail" type="email" value={conta.email} onChange={atualizar('email')} autoComplete="email" placeholder="seu@email.com" aria-invalid={emailInvalido} required />
          {emailInvalido && <small className="login__erro">E-mail inválido.</small>}
        </div>
        <div className="login__grid">
          <div className="login__campo">
            <AuthField label="Senha" type="password" value={conta.senha} onChange={atualizar('senha')} autoComplete="new-password" aria-invalid={senhaCurta} required />
            <small className={senhaCurta ? 'login__erro' : 'login__dica'}>Mínimo de {SENHA_MINIMA} caracteres.</small>
          </div>
          <div className="login__campo">
            <AuthField
              label="Confirme a senha"
              type="password"
              value={conta.senhaConfirmacao}
              onChange={atualizar('senhaConfirmacao')}
              onPaste={(e) => e.preventDefault()}
              autoComplete="new-password"
              aria-invalid={senhasDiferentes}
              required
            />
            {senhasDiferentes && <small className="login__erro">As senhas não conferem.</small>}
          </div>
        </div>
        <FormError error={erro} />
        <button type="submit" className="login__submit" disabled={enviando || !pronta}>
          {enviando ? 'Criando conta…' : 'Criar conta'}
        </button>
      </form>
      <p className="acesso__alternativa">
        Já tem uma conta?{' '}
        <Link to="/login" state={location.state}>
          Entrar
        </Link>
      </p>
    </LayoutAcesso>
  )
}
