import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { PinInput } from '../components/loja/PinInput'
import { FormError } from '../components/ui/FormError'
import { pedidosService } from '../services/pedidosService'

// Passo 2 da recuperação: aberta pelo link do e-mail, define o PIN novo
export function NovoPinPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') ?? ''
  const [pin, setPin] = useState('')
  const [pinConfirmacao, setPinConfirmacao] = useState('')
  const [erro, setErro] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const diferentes = pinConfirmacao.length === 4 && pin !== pinConfirmacao

  const salvar = async (e) => {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      const { email } = await pedidosService.redefinirPin({ token, pin, pinConfirmacao })
      // E-mail vai no state da navegação, não na URL (não fica no histórico)
      navigate('/meus-pedidos', { replace: true, state: { pinNovo: true, email } })
    } catch (error) {
      setErro(error)
      setEnviando(false)
    }
  }

  if (!token) {
    return (
      <main className="store-section store-section--page orders-login">
        <h1 className="store-heading store-heading--lg">Link inválido</h1>
        <p className="orders-login__intro">Peça um novo link em Meus pedidos, na opção “Esqueci meu PIN”.</p>
        <Link to="/meus-pedidos" className="pdp__cta orders-login__cta">
          Ir para Meus pedidos
        </Link>
      </main>
    )
  }

  return (
    <main className="store-section store-section--page orders-login">
      <h1 className="store-heading store-heading--lg">Crie um PIN novo</h1>
      <p className="orders-login__intro">Ele substitui o PIN anterior e vale para todos os seus pedidos.</p>

      <form className="orders-login__form" onSubmit={salvar}>
        <PinInput label="Novo PIN" value={pin} onChange={setPin} autoComplete="new-password" autoFocus />
        <PinInput label="Confirme o PIN" value={pinConfirmacao} onChange={setPinConfirmacao} onPaste={(e) => e.preventDefault()} invalid={diferentes} autoComplete="new-password" />
        {diferentes && <small className="co-error orders-login__center">Os PINs não conferem.</small>}
        <FormError error={erro} />
        <button type="submit" className="pdp__cta" disabled={enviando || pin.length !== 4 || pin !== pinConfirmacao}>
          {enviando ? 'Salvando…' : 'Salvar PIN'}
        </button>
      </form>
    </main>
  )
}
