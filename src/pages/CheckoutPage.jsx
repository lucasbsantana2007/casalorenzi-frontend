import { Lock } from 'lucide-react'
import { useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { FormError } from '../components/ui/FormError'
import { Select } from '../components/ui/Select'
import { imagemDoProduto } from '../data/imagensProdutos'
import { useAsync } from '../hooks/useAsync'
import { useCondicoesFrete } from '../hooks/useCadastros'
import { useSacola } from '../hooks/useSacola'
import { useSession } from '../hooks/useSession'
import { contaService } from '../services/contaService'
import { pedidosService } from '../services/pedidosService'
import { buscarEnderecoPorCep } from '../utils/cep'
import { cpfValido, formatarCpf, somenteDigitosCpf } from '../utils/cpf'
import { COMPRA_MINIMA_RESGATE, formatarPontos, maximoResgatavel, podeResgatar, pontosDaCompra, RESGATE_MULTIPLO, valorEmReais } from '../utils/fidelidade'
import { calcularFrete, formatarCep } from '../utils/frete'
import { formatCurrency } from '../utils/format'

const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']
const PARCELAS = [1, 2, 3, 4, 5, 6]
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SENHA_MINIMA = 8

const prazo = (dias) => `${dias} dia${dias === 1 ? '' : 's'} ${dias === 1 ? 'útil' : 'úteis'}`

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
  const { usuario, isCliente, login, cadastrar, logout } = useSession()
  // Sem conta não há compra: quem não está logado cria a conta aqui ou entra na que já tem
  const [modoConta, setModoConta] = useState('cadastro')
  const [conta, setConta] = useState({ nome: '', cpf: '', telefone: '', email: '', senha: '', senhaConfirmacao: '' })
  const [dados, setDados] = useState({
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
  const condicoesFrete = useCondicoesFrete()
  // Vulto+ do cliente logado (saldo para o resgate e a categoria para o bônus)
  const vulto = useAsync(() => (isCliente ? contaService.pontos() : Promise.resolve(null)), [isCliente, usuario?.id]).data
  const [pontosUsar, setPontosUsar] = useState(0)
  // CEP completo preenche rua, bairro, cidade e estado (ViaCEP); null | 'buscando' | 'nao-encontrado' | 'falhou'
  const [consultaCep, setConsultaCep] = useState(null)
  const ultimoCep = useRef('')
  const campoNumero = useRef(null)

  // Depois de finalizar, a sacola esvazia; não volta para cá
  if (!itens.length && !enviando) return <Navigate to="/" replace />

  const set = (campo) => (e) => setDados((d) => ({ ...d, [campo]: e.target.value }))

  const mudarCep = (e) => {
    const cep = formatarCep(e.target.value)
    setDados((d) => ({ ...d, cep }))
    const digitos = cep.replace(/\D/g, '')
    if (digitos.length !== 8 || digitos === ultimoCep.current) {
      if (digitos.length !== 8) setConsultaCep(null)
      return
    }
    ultimoCep.current = digitos
    setConsultaCep('buscando')
    buscarEnderecoPorCep(digitos)
      .then((endereco) => {
        if (ultimoCep.current !== digitos) return // a pessoa já digitou outro CEP
        if (!endereco) {
          setConsultaCep('nao-encontrado')
          return
        }
        // Número e complemento ficam com a pessoa; o resto vem do CEP (rua e bairro vazios em CEP de cidade)
        setDados((d) => ({ ...d, rua: endereco.rua, bairro: endereco.bairro, cidade: endereco.cidade, uf: endereco.uf }))
        setConsultaCep(null)
        if (endereco.rua) campoNumero.current?.focus()
      })
      .catch(() => {
        if (ultimoCep.current === digitos) setConsultaCep('falhou')
      })
  }
  const opcoesFrete = calcularFrete(dados.cep, subtotal, condicoesFrete)
  const frete = opcoesFrete.find((f) => f.tipo === freteTipo) ?? opcoesFrete[0]
  // Resgate: o máximo muda com a sacola, então o valor escolhido é limitado na hora
  const maxPontos = vulto && podeResgatar(subtotal) ? maximoResgatavel(vulto.saldo, subtotal) : 0
  const pontosAplicados = Math.min(pontosUsar, maxPontos)
  const descontoPontos = valorEmReais(pontosAplicados)
  const pontosAGanhar = pontosDaCompra(subtotal, 'E-commerce', vulto?.categoria)
  const total = subtotal - descontoPontos + (frete?.valor ?? 0)
  const atualizarConta = (campo) => (e) => setConta((c) => ({ ...c, [campo]: e.target.value }))
  const emailInvalido = conta.email.length > 0 && !EMAIL_VALIDO.test(conta.email.trim())
  const cpfInvalido = somenteDigitosCpf(conta.cpf).length === 11 && !cpfValido(conta.cpf)
  const senhaCurta = conta.senha.length > 0 && conta.senha.length < SENHA_MINIMA
  const senhasDiferentes = conta.senhaConfirmacao.length > 0 && conta.senha !== conta.senhaConfirmacao
  const contaPronta = isCliente
    ? true
    : modoConta === 'entrar'
      ? EMAIL_VALIDO.test(conta.email.trim()) && conta.senha.length > 0
      : conta.nome.trim().length > 0 &&
        cpfValido(conta.cpf) &&
        EMAIL_VALIDO.test(conta.email.trim()) &&
        conta.senha.length >= SENHA_MINIMA &&
        conta.senha === conta.senhaConfirmacao

  const trocarModo = (modo) => {
    setErro(null)
    setModoConta(modo)
    setConta((c) => ({ ...c, senha: '', senhaConfirmacao: '' }))
  }

  const finalizar = async (e) => {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      // 1) Garante a conta: entra ou cadastra (o cadastro já deixa o cliente logado)
      let clienteId = isCliente ? usuario.id : null
      if (!isCliente && modoConta === 'entrar') {
        clienteId = (await login({ email: conta.email, senha: conta.senha, manterConectado: true, somenteCliente: true })).id
      } else if (!isCliente) {
        clienteId = somenteDigitosCpf(conta.cpf)
        await cadastrar({ ...conta, cpf: clienteId })
      }
      // 2) Fecha o pedido em nome do cliente logado
      const { cep, rua, numero, complemento, bairro, cidade, uf } = dados
      const pedido = await pedidosService.finalizarCompra({
        clienteId,
        endereco: { cep, rua, numero, complemento, bairro, cidade, uf },
        freteTipo: frete?.tipo,
        pagamento: { metodo, parcelas },
        pontos: pontosAplicados,
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
            <span>1</span> Sua conta
          </h2>
          {isCliente ? (
            <p className="co-account">
              Comprando como <strong>{usuario.nome}</strong> · {usuario.email}
              <button type="button" className="co-account__switch" onClick={logout}>
                Não é você? Sair
              </button>
            </p>
          ) : modoConta === 'entrar' ? (
            <>
              <div className="co-grid">
                <Campo label="E-mail">
                  <input type="email" autoComplete="email" value={conta.email} onChange={atualizarConta('email')} required aria-invalid={emailInvalido} />
                  {emailInvalido && <small className="co-error">E-mail inválido.</small>}
                </Campo>
                <Campo label="Senha">
                  <input type="password" autoComplete="current-password" value={conta.senha} onChange={atualizarConta('senha')} required />
                </Campo>
              </div>
              <p className="co-account__toggle">
                Não tem conta?{' '}
                <button type="button" onClick={() => trocarModo('cadastro')}>
                  Criar conta
                </button>
              </p>
            </>
          ) : (
            <>
              <p className="co-step__hint">Crie sua conta para finalizar a compra. Com ela você acompanha seus pedidos.</p>
              <div className="co-grid">
                <Campo label="Nome completo">
                  <input autoComplete="name" value={conta.nome} onChange={atualizarConta('nome')} required />
                </Campo>
                <Campo label="CPF">
                  <input
                    inputMode="numeric"
                    value={conta.cpf}
                    onChange={(e) => setConta((c) => ({ ...c, cpf: formatarCpf(e.target.value) }))}
                    placeholder="000.000.000-00"
                    required
                    aria-invalid={cpfInvalido}
                  />
                  {cpfInvalido && <small className="co-error">CPF inválido.</small>}
                </Campo>
                <Campo label="E-mail">
                  <input type="email" autoComplete="email" value={conta.email} onChange={atualizarConta('email')} required aria-invalid={emailInvalido} />
                  {emailInvalido && <small className="co-error">E-mail inválido.</small>}
                </Campo>
                <Campo label="Celular">
                  <input type="tel" autoComplete="tel" value={conta.telefone} onChange={atualizarConta('telefone')} placeholder="(11) 90000-0000" />
                </Campo>
                <Campo label="Senha">
                  <input type="password" autoComplete="new-password" value={conta.senha} onChange={atualizarConta('senha')} required aria-invalid={senhaCurta} />
                  <small className={senhaCurta ? 'co-error' : 'co-field__hint'}>Mínimo de 8 caracteres.</small>
                </Campo>
                <Campo label="Confirme a senha">
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={conta.senhaConfirmacao}
                    onChange={atualizarConta('senhaConfirmacao')}
                    onPaste={(e) => e.preventDefault()}
                    required
                    aria-invalid={senhasDiferentes}
                  />
                  {senhasDiferentes && <small className="co-error">As senhas não conferem.</small>}
                </Campo>
              </div>
              <p className="co-account__toggle">
                Já tem uma conta?{' '}
                <button type="button" onClick={() => trocarModo('entrar')}>
                  Entrar
                </button>
              </p>
            </>
          )}
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
                onChange={mudarCep}
                placeholder="00000-000"
                required
                aria-invalid={consultaCep === 'nao-encontrado'}
              />
              {consultaCep === 'buscando' && <small className="co-field__hint">Buscando o endereço…</small>}
              {consultaCep === 'nao-encontrado' && <small className="co-error">CEP não encontrado. Confira o número.</small>}
              {consultaCep === 'falhou' && <small className="co-field__hint">Não foi possível buscar o endereço agora. Preencha os campos abaixo.</small>}
            </Campo>
            <a className="co-cep-link" href="https://buscacepinter.correios.com.br/app/endereco/index.php" target="_blank" rel="noreferrer">
              Não sei meu CEP
            </a>
            <Campo label="Rua" wide>
              <input autoComplete="address-line1" value={dados.rua} onChange={set('rua')} required />
            </Campo>
            <Campo label="Número">
              <input ref={campoNumero} value={dados.numero} onChange={set('numero')} required />
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
              <Select value={dados.uf} onChange={set('uf')} required>
                <option value="">Selecione</option>
                {UFS.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </Select>
            </Campo>
          </div>

          <div className="co-options" role="radiogroup" aria-label="Frete">
            {dados.cep.length < 9 ? (
              <p className="co-step__hint">Informe o CEP para ver as opções de frete.</p>
            ) : !condicoesFrete ? (
              <p className="co-step__hint">Calculando o frete…</p>
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
          {vulto && (
            <ResgateVultoMais
              saldo={vulto.saldo}
              subtotal={subtotal}
              maximo={maxPontos}
              valor={pontosAplicados}
              onChange={(v) => setPontosUsar(Math.max(0, Math.floor(v / RESGATE_MULTIPLO) * RESGATE_MULTIPLO))}
            />
          )}
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
                <Select className="co-option__select" value={parcelas} onChange={(e) => setParcelas(Number(e.target.value))} aria-label="Parcelas">
                  {PARCELAS.map((n) => (
                    <option key={n} value={n}>
                      {n}x de {formatCurrency(total / n)}
                    </option>
                  ))}
                </Select>
              )}
            </label>
          </div>
          <p className="co-step__hint co-step__hint--demo">
            Pagamento simulado nesta versão de demonstração: nenhum dado de cartão é pedido ou cobrado.
          </p>
        </section>

        <FormError error={erro} />

        <button type="submit" className="pdp__cta co-submit" disabled={enviando || !contaPronta || !frete}>
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
                <img src={imagemDoProduto({ id: item.produtoId, imagemUrl: item.imagemUrl })} alt="" />
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
          {pontosAplicados > 0 && (
            <div className="co-totals__desconto">
              <dt>Pontos Vulto+ ({pontosAplicados.toLocaleString('pt-BR')})</dt>
              <dd>− {formatCurrency(descontoPontos)}</dd>
            </div>
          )}
          <div className="co-totals__total">
            <dt>Total</dt>
            <dd>{formatCurrency(total)}</dd>
          </div>
        </dl>
        {pontosAGanhar > 0 && (
          <p className="co-step__hint co-ganho">
            Esta compra rende {formatarPontos(pontosAGanhar)} Vulto+{vulto?.bonus ? ` (bônus ${vulto.categoria} +${vulto.bonus}%)` : ''}.
          </p>
        )}
        {condicoesFrete && subtotal < condicoesFrete.gratisMinimo && (
          <p className="co-step__hint">Frete Padrão grátis a partir de {formatCurrency(condicoesFrete.gratisMinimo)}.</p>
        )}
        <button type="button" className="bag-summary__continue" onClick={abrirSacola}>
          Editar sacola
        </button>
      </aside>
    </main>
  )
}

// Uso dos pontos Vulto+ no pagamento: só para cliente logado, de 100 em 100, em compras a partir de R$ 500 em produtos
function ResgateVultoMais({ saldo, subtotal, maximo, valor, onChange }) {
  let aviso = null
  if (saldo < RESGATE_MULTIPLO) aviso = `Você tem ${formatarPontos(saldo)} Vulto+. A partir de ${RESGATE_MULTIPLO} dá para usar como desconto.`
  else if (!podeResgatar(subtotal))
    aviso = `Você tem ${formatarPontos(saldo)} Vulto+ (${formatCurrency(valorEmReais(saldo))}). Dá para usar em compras a partir de ${formatCurrency(COMPRA_MINIMA_RESGATE)} em produtos: faltam ${formatCurrency(COMPRA_MINIMA_RESGATE - subtotal)}.`

  return (
    <div className="co-pontos">
      <div className="co-pontos__topo">
        <strong>Pontos Vulto+</strong>
        <span>{formatarPontos(saldo)} · {formatCurrency(valorEmReais(saldo))}</span>
      </div>
      {aviso ? (
        <p className="co-step__hint">{aviso}</p>
      ) : (
        <div className="co-pontos__uso">
          <label className="co-field">
            <span>Usar pontos (de {RESGATE_MULTIPLO} em {RESGATE_MULTIPLO})</span>
            <input type="number" min={0} max={maximo} step={RESGATE_MULTIPLO} value={valor} onChange={(e) => onChange(Number(e.target.value) || 0)} />
          </label>
          <button type="button" className="co-pontos__tudo" onClick={() => onChange(valor === maximo ? 0 : maximo)}>
            {valor === maximo ? 'Não usar' : `Usar ${formatarPontos(maximo)}`}
          </button>
          <p className="co-step__hint">
            {valor > 0 ? `Desconto de ${formatCurrency(valorEmReais(valor))} nos produtos.` : `Até ${formatarPontos(maximo)} nesta compra (${formatCurrency(valorEmReais(maximo))}).`}
          </p>
        </div>
      )}
    </div>
  )
}
