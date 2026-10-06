import { Lock } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { PinInput } from '../components/loja/PinInput'
import { FormError } from '../components/ui/FormError'
import { imagemDoProduto } from '../data/imagensProdutos'
import { useSacola } from '../hooks/useSacola'
import { pedidosService } from '../services/pedidosService'
import { calcularFrete, formatarCep, FRETE_GRATIS_MINIMO } from '../utils/frete'
import { formatCurrency } from '../utils/format'

const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']
const PARCELAS = [1, 2, 3, 4, 5, 6]
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const prazo = (dias) => `${dias} dia${dias === 1 ? '' : 's'} úte${dias === 1 ? 'l' : 'is'}`

function Campo({ label, children, wide = false }) {
  return (
    <label className={`co-field ${wide ? 'co-field--wide' : ''}`}>
      <span>{label}</span>
      {children}
    </label>
  )
}

export function CheckoutPage() {
  const { itens, subtotal, esvaziar, abrir: abrirSacola } = useSacola()
  const navigate = useNavigate()
  const [dados, setDados] = useState({
    email: '',
    emailConfirmacao: '',
    pin: '',
    pinConfirmacao: '',
    nome: '',
    telefone: '',
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
  })
  const [freteTipo, setFreteTipo] = useState('PADRAO')
  const [metodo, setMetodo] = useState('PIX')
  const [parcelas, setParcelas] = useState(1)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState(null)

  // Depois de finalizar, a sacola esvazia; não volta para cá
  if (!itens.length && !enviando) return <Navigate to="/" replace />

  const set = (campo) => (e) => setDados((d) => ({ ...d, [campo]: e.target.value }))
  const opcoesFrete = calcularFrete(dados.cep, subtotal)
  const frete = opcoesFrete.find((f) => f.tipo === freteTipo) ?? opcoesFrete[0]
  const total = subtotal + (frete?.valor ?? 0)
  const emailsDiferentes = dados.emailConfirmacao.length > 0 && dados.email.trim().toLowerCase() !== dados.emailConfirmacao.trim().toLowerCase()
  const emailInvalido = dados.email.length > 0 && !EMAIL_VALIDO.test(dados.email.trim())
  const pinsDiferentes = dados.pinConfirmacao.length === 4 && dados.pin !== dados.pinConfirmacao
  const pinIncompleto = dados.pin.length !== 4 || dados.pinConfirmacao.length !== 4
  const setPin = (campo) => (valor) => setDados((d) => ({ ...d, [campo]: valor }))

  const finalizar = async (e) => {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      const { cep, rua, numero, complemento, bairro, cidade, uf, ...contato } = dados
      const pedido = await pedidosService.finalizarCompra({
        ...contato,
        endereco: { cep, rua, numero, complemento, bairro, cidade, uf },
        freteTipo: frete?.tipo,
        pagamento: { metodo, parcelas },
        itens: itens.map(({ variacaoId, quantidade }) => ({ variacaoId, quantidade })),
      })
      esvaziar()
      navigate(`/pedido/confirmado/${pedido.numero}`, { replace: true, state: { pedido } })
    } catch (error) {
      setErro(error)
      setEnviando(false)
    }
  }

  return (
    <main className="checkout">
      <form className="checkout__form" onSubmit={finalizar} noValidate>
        <h1 className="store-heading store-heading--lg">Checkout</h1>

        <section className="co-step">
          <h2>
            <span>1</span> Contato
          </h2>
          <p className="co-step__hint">Não é preciso criar conta. A confirmação da compra vai para este e-mail.</p>
          <div className="co-grid">
            <Campo label="E-mail" wide>
              <input type="email" autoComplete="email" value={dados.email} onChange={set('email')} required aria-invalid={emailInvalido} />
            </Campo>
            <Campo label="Confirme o e-mail" wide>
              <input
                type="email"
                autoComplete="off"
                value={dados.emailConfirmacao}
                onChange={set('emailConfirmacao')}
                onPaste={(e) => e.preventDefault()}
                required
                aria-invalid={emailsDiferentes}
              />
              {emailInvalido && <small className="co-error">E-mail inválido.</small>}
              {!emailInvalido && emailsDiferentes && <small className="co-error">Os e-mails não conferem.</small>}
            </Campo>
            <div className="co-pin">
              <PinInput label="Crie um PIN de 4 números" value={dados.pin} onChange={setPin('pin')} autoComplete="new-password" />
            </div>
            <div className="co-pin">
              <PinInput
                label="Confirme o PIN"
                value={dados.pinConfirmacao}
                onChange={setPin('pinConfirmacao')}
                onPaste={(e) => e.preventDefault()}
                invalid={pinsDiferentes}
                autoComplete="new-password"
              />
              {pinsDiferentes && <small className="co-error">Os PINs não conferem.</small>}
            </div>
            <p className="co-step__hint co-grid__full">
              Com o e-mail e o PIN você acessa <strong>Meus pedidos</strong> para acompanhar entregas e pedir trocas. Já comprou antes com este e-mail? Use o mesmo PIN.
            </p>
            <Campo label="Nome completo">
              <input autoComplete="name" value={dados.nome} onChange={set('nome')} required />
            </Campo>
            <Campo label="Celular">
              <input type="tel" autoComplete="tel" value={dados.telefone} onChange={set('telefone')} placeholder="(11) 90000-0000" />
            </Campo>
          </div>
        </section>

        <section className="co-step">
          <h2>
            <span>2</span> Entrega
          </h2>
          <div className="co-grid">
            <Campo label="CEP">
              <input
                inputMode="numeric"
                autoComplete="postal-code"
                value={dados.cep}
                onChange={(e) => setDados((d) => ({ ...d, cep: formatarCep(e.target.value) }))}
                placeholder="00000-000"
                required
              />
            </Campo>
            <span />
            <Campo label="Rua" wide>
              <input autoComplete="address-line1" value={dados.rua} onChange={set('rua')} required />
            </Campo>
            <Campo label="Número">
              <input value={dados.numero} onChange={set('numero')} required />
            </Campo>
            <Campo label="Complemento">
              <input autoComplete="address-line2" value={dados.complemento} onChange={set('complemento')} placeholder="Opcional" />
            </Campo>
            <Campo label="Bairro">
              <input value={dados.bairro} onChange={set('bairro')} required />
            </Campo>
            <Campo label="Cidade">
              <input autoComplete="address-level2" value={dados.cidade} onChange={set('cidade')} required />
            </Campo>
            <Campo label="Estado">
              <select value={dados.uf} onChange={set('uf')} required>
                <option value="">Selecione</option>
                {UFS.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </Campo>
          </div>

          <div className="co-options" role="radiogroup" aria-label="Frete">
            {dados.cep.length < 9 ? (
              <p className="co-step__hint">Informe o CEP para ver as opções de frete.</p>
            ) : !opcoesFrete.length ? (
              <p className="co-error">Ainda não entregamos neste CEP.</p>
            ) : (
              opcoesFrete.map((f) => (
                <label key={f.tipo} className={`co-option ${frete?.tipo === f.tipo ? 'is-selected' : ''}`}>
                  <input type="radio" name="frete" checked={frete?.tipo === f.tipo} onChange={() => setFreteTipo(f.tipo)} />
                  <span className="co-option__main">
                    <strong>{f.label}</strong>
                    <small>Até {prazo(f.prazoDias)}</small>
                  </span>
                  <strong>{f.valor === 0 ? 'Grátis' : formatCurrency(f.valor)}</strong>
                </label>
              ))
            )}
          </div>
        </section>

        <section className="co-step">
          <h2>
            <span>3</span> Pagamento
          </h2>
          <div className="co-options" role="radiogroup" aria-label="Forma de pagamento">
            <label className={`co-option ${metodo === 'PIX' ? 'is-selected' : ''}`}>
              <input type="radio" name="pagamento" checked={metodo === 'PIX'} onChange={() => setMetodo('PIX')} />
              <span className="co-option__main">
                <strong>Pix</strong>
                <small>Aprovação na hora</small>
              </span>
            </label>
            <label className={`co-option ${metodo === 'CARTAO' ? 'is-selected' : ''}`}>
              <input type="radio" name="pagamento" checked={metodo === 'CARTAO'} onChange={() => setMetodo('CARTAO')} />
              <span className="co-option__main">
                <strong>Cartão de crédito</strong>
                <small>Até 6x sem juros</small>
              </span>
              {metodo === 'CARTAO' && (
                <select className="co-option__select" value={parcelas} onChange={(e) => setParcelas(Number(e.target.value))} aria-label="Parcelas">
                  {PARCELAS.map((n) => (
                    <option key={n} value={n}>
                      {n}x de {formatCurrency(total / n)}
                    </option>
                  ))}
                </select>
              )}
            </label>
          </div>
          <p className="co-step__hint co-step__hint--demo">
            Pagamento simulado nesta versão de demonstração: nenhum dado de cartão é pedido ou cobrado.
          </p>
        </section>

        <FormError error={erro} />

        <button type="submit" className="pdp__cta co-submit" disabled={enviando || emailsDiferentes || emailInvalido || pinsDiferentes || pinIncompleto || !frete}>
          <Lock size={14} aria-hidden="true" />
          {enviando ? 'Processando…' : `Finalizar compra · ${formatCurrency(total)}`}
        </button>
      </form>

      <aside className="checkout__summary">
        <h2>Sua sacola</h2>
        <ul className="co-items">
          {itens.map((item) => (
            <li key={item.variacaoId}>
              <span className="co-items__image">
                <img src={imagemDoProduto({ id: item.produtoId })} alt="" />
                <span className="co-items__qty">{item.quantidade}</span>
              </span>
              <span className="co-items__info">
                <strong>{item.nome}</strong>
                <small>
                  {item.cor} · {item.tamanho}
                </small>
              </span>
              <span>{formatCurrency(item.preco * item.quantidade)}</span>
            </li>
          ))}
        </ul>
        <dl className="co-totals">
          <div>
            <dt>Subtotal</dt>
            <dd>{formatCurrency(subtotal)}</dd>
          </div>
          <div>
            <dt>Frete{frete ? ` · ${frete.label}` : ''}</dt>
            <dd>{frete ? (frete.valor === 0 ? 'Grátis' : formatCurrency(frete.valor)) : '—'}</dd>
          </div>
          <div className="co-totals__total">
            <dt>Total</dt>
            <dd>{formatCurrency(total)}</dd>
          </div>
        </dl>
        {subtotal < FRETE_GRATIS_MINIMO && (
          <p className="co-step__hint">Frete Padrão grátis a partir de {formatCurrency(FRETE_GRATIS_MINIMO)}.</p>
        )}
        <button type="button" className="bag-summary__continue" onClick={abrirSacola}>
          Editar sacola
        </button>
      </aside>
    </main>
  )
}
