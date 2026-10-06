import { ChevronDown, LogOut, Send } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { MessageThread } from '../components/atendimento/MessageThread'
import { PedidoDetalhesLoja, PedidoProgresso } from '../components/loja/PedidoDetalhesLoja'
import { PinInput } from '../components/loja/PinInput'
import { SeletorPedido } from '../components/loja/SeletorPedido'
import { AsyncContent } from '../components/ui/AsyncContent'
import { FormError } from '../components/ui/FormError'
import { StatusBadge } from '../components/ui/StatusBadge'
import { imagemDoProduto } from '../data/imagensProdutos'
import { useAsync } from '../hooks/useAsync'
import { cadastrosService } from '../services/cadastrosService'
import { pedidosService } from '../services/pedidosService'
import { formatCurrency, formatDate, formatRelative } from '../utils/format'

// Tipos de solicitação que fazem sentido depois de uma compra
const POS_VENDA = ['Pós-venda', 'Pedidos', 'Serviços', 'Qualidade', 'Outros']

const ABAS = [
  { value: 'pedidos', label: 'Meus pedidos' },
  { value: 'solicitacoes', label: 'Minhas solicitações' },
  { value: 'novo', label: 'Abrir um chamado' },
]

// Atendimento ao cliente sem login: e-mail + PIN (criado no checkout) abrem pedidos e chamados do e-mail
export function MeusPedidosPage() {
  const [acesso, setAcesso] = useState(null) // { email, pin }
  const [pedidos, setPedidos] = useState([])
  const [aba, setAba] = useState('pedidos')
  const [pedidoDoChamado, setPedidoDoChamado] = useState('')
  const [chamadoAberto, setChamadoAberto] = useState(null) // id do chamado recém-criado

  if (!acesso) {
    return (
      <Entrar
        onEntrar={(dados, lista) => {
          setAcesso(dados)
          setPedidos(lista)
        }}
      />
    )
  }

  const sair = () => {
    setAcesso(null)
    setPedidos([])
    setAba('pedidos')
  }

  return (
    <main className="store-section store-section--page orders">
      <div className="orders__head">
        <div>
          <h1 className="store-heading store-heading--lg">Atendimento</h1>
          <p className="orders__email">{acesso.email}</p>
        </div>
        <button type="button" className="orders__exit" onClick={sair}>
          <LogOut size={14} aria-hidden="true" /> Sair
        </button>
      </div>

      <nav className="orders__tabs" role="tablist" aria-label="Atendimento">
        {ABAS.map((a) => (
          <button
            key={a.value}
            type="button"
            role="tab"
            aria-selected={aba === a.value}
            className={aba === a.value ? 'is-active' : ''}
            onClick={() => setAba(a.value)}
          >
            {a.label}
          </button>
        ))}
      </nav>

      {aba === 'pedidos' &&
        (pedidos.length === 0 ? (
          <p className="orders__empty">Nenhum pedido encontrado para este e-mail.</p>
        ) : (
          <ul className="orders__list">
            {pedidos.map((pedido, i) => (
              <PedidoItem
                key={pedido.numero}
                pedido={pedido}
                abertoInicial={i === 0}
                onAjuda={() => {
                  setPedidoDoChamado(pedido.numero)
                  setAba('novo')
                }}
              />
            ))}
          </ul>
        ))}

      {aba === 'solicitacoes' && <MinhasSolicitacoes acesso={acesso} destacar={chamadoAberto} onNovo={() => setAba('novo')} />}

      {aba === 'novo' && (
        <NovoChamado
          acesso={acesso}
          pedidos={pedidos}
          pedidoInicial={pedidoDoChamado}
          onCriado={(id) => {
            setChamadoAberto(id)
            setPedidoDoChamado('')
            setAba('solicitacoes')
          }}
        />
      )}
    </main>
  )
}

function Entrar({ onEntrar }) {
  // Vindo da troca de PIN: mostra o aviso e já preenche o e-mail
  const voltaDoNovoPin = useLocation().state
  const [esqueci, setEsqueci] = useState(false)
  const [email, setEmail] = useState(voltaDoNovoPin?.email ?? '')
  const [pin, setPin] = useState('')
  const [erro, setErro] = useState(null)
  const [enviando, setEnviando] = useState(false)

  const entrar = async (e) => {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      const dados = { email: email.trim(), pin }
      onEntrar(dados, await pedidosService.listarMeusPedidos(dados))
    } catch (error) {
      setErro(error)
      setEnviando(false)
    }
  }

  if (esqueci) return <EsqueciPin emailInicial={email} onVoltar={() => setEsqueci(false)} />

  return (
    <main className="store-section store-section--page orders-login">
      <h1 className="store-heading store-heading--lg">Atendimento</h1>
      {voltaDoNovoPin?.pinNovo && <p className="orders-login__ok">PIN alterado. Entre com o PIN novo.</p>}
      <p className="orders-login__intro">Acompanhe seus pedidos e fale com a nossa equipe. Entre com o e-mail da compra e o PIN de 4 dígitos que você criou no checkout.</p>

      <form className="orders-login__form" onSubmit={entrar}>
        <label className="co-field">
          <span>E-mail</span>
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <PinInput label="PIN" value={pin} onChange={setPin} />
        <FormError error={erro} />
        <button type="submit" className="pdp__cta" disabled={enviando || pin.length !== 4}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
      <button type="button" className="orders-login__help" onClick={() => setEsqueci(true)}>
        Esqueci meu PIN
      </button>
    </main>
  )
}

// Passo 1 da recuperação: pede o e-mail e envia o link de confirmação
function EsqueciPin({ emailInicial, onVoltar }) {
  const [email, setEmail] = useState(emailInicial)
  const [enviado, setEnviado] = useState(null)
  const [erro, setErro] = useState(null)
  const [enviando, setEnviando] = useState(false)

  const enviar = async (e) => {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      setEnviado(await pedidosService.solicitarNovoPin({ email: email.trim() }))
    } catch (error) {
      setErro(error)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="store-section store-section--page orders-login">
      <h1 className="store-heading store-heading--lg">Novo PIN</h1>
      {enviado ? (
        <>
          <p className="orders-login__intro">
            Se houver compras com <strong>{email.trim()}</strong>, enviamos um e-mail com o link para criar um PIN novo. O link vale por 30 minutos.
          </p>
          {enviado.linkDemo && (
            <div className="orders-login__demo">
              <span>Demonstração: os e-mails ainda não são enviados de verdade.</span>
              <Link to={enviado.linkDemo} className="pdp__cta">
                Abrir o e-mail e criar o PIN
              </Link>
            </div>
          )}
        </>
      ) : (
        <>
          <p className="orders-login__intro">Informe o e-mail usado nas compras. Vamos enviar um link de confirmação para você criar um PIN novo.</p>
          <form className="orders-login__form" onSubmit={enviar}>
            <label className="co-field">
              <span>E-mail</span>
              <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <FormError error={erro} />
            <button type="submit" className="pdp__cta" disabled={enviando}>
              {enviando ? 'Enviando…' : 'Enviar link'}
            </button>
          </form>
        </>
      )}
      <button type="button" className="orders-login__help" onClick={onVoltar}>
        Voltar
      </button>
    </main>
  )
}

function PedidoItem({ pedido, abertoInicial, onAjuda }) {
  const [aberto, setAberto] = useState(abertoInicial)
  const pecas = pedido.itens.reduce((sum, i) => sum + i.quantidade, 0)

  return (
    <li className={`order-card ${aberto ? 'is-open' : ''}`}>
      <button type="button" className="order-card__summary" aria-expanded={aberto} onClick={() => setAberto((v) => !v)}>
        <span className="order-card__thumbs" aria-hidden="true">
          {pedido.itens.slice(0, 3).map((item) => (
            <img key={item.variacaoId} src={imagemDoProduto({ id: item.variacao.produto.id })} alt="" />
          ))}
        </span>
        <span className="order-card__main">
          <strong>Pedido {pedido.numero}</strong>
          <small>
            {formatDate(pedido.criadoEm)} · {pecas} {pecas === 1 ? 'peça' : 'peças'} · {formatCurrency(pedido.total)}
          </small>
        </span>
        <StatusBadge type="pedido" value={pedido.status} />
        <ChevronDown size={18} className="order-card__chevron" aria-hidden="true" />
      </button>

      {aberto && (
        <div className="order-card__body">
          <PedidoProgresso pedido={pedido} />
          <PedidoDetalhesLoja pedido={pedido} />
          <button type="button" className="order-help__open" onClick={onAjuda}>
            Abrir um chamado sobre este pedido
          </button>
        </div>
      )}
    </li>
  )
}

function MinhasSolicitacoes({ acesso, destacar, onNovo }) {
  const state = useAsync(() => pedidosService.listarMinhasSolicitacoes(acesso), [acesso])

  return (
    <AsyncContent
      state={state}
      empty={
        <div className="orders__empty">
          <p>Você ainda não abriu nenhum chamado.</p>
          <button type="button" className="order-help__open" onClick={onNovo}>
            Abrir um chamado
          </button>
        </div>
      }
    >
      {(lista) => (
        <ul className="orders__list">
          {lista.map((s) => (
            <SolicitacaoItem key={s.id} inicial={s} acesso={acesso} abertoInicial={s.id === destacar} />
          ))}
        </ul>
      )}
    </AsyncContent>
  )
}

function SolicitacaoItem({ inicial, acesso, abertoInicial }) {
  const [s, setS] = useState(inicial)
  const [aberto, setAberto] = useState(abertoInicial)
  const [resposta, setResposta] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState(null)

  const responder = async (e) => {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      setS(await pedidosService.responderSolicitacao({ ...acesso, id: s.id, conteudo: resposta }))
      setResposta('')
    } catch (error) {
      setErro(error)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <li className={`order-card ${aberto ? 'is-open' : ''}`}>
      <button type="button" className="order-card__summary" aria-expanded={aberto} onClick={() => setAberto((v) => !v)}>
        <span className="order-card__main">
          <strong>{s.tipo}</strong>
          <small>
            Protocolo {s.protocolo}
            {s.pedidoNumero && ` · Pedido ${s.pedidoNumero}`} · atualizado {formatRelative(s.atualizadoEm)}
          </small>
        </span>
        <StatusBadge type="atendimento" value={s.status} />
        <ChevronDown size={18} className="order-card__chevron" aria-hidden="true" />
      </button>

      {aberto && (
        <div className="order-card__body ticket">
          <MessageThread mensagens={s.mensagens} perspectiva="CLIENTE" nomeCliente="Você" />
          {s.status === 'CONCLUIDO' ? (
            <p className="ticket__closed">Este chamado foi encerrado. Se precisar, abra um novo.</p>
          ) : (
            <form className="ticket__reply" onSubmit={responder}>
              <textarea rows={3} value={resposta} onChange={(e) => setResposta(e.target.value)} placeholder="Escreva sua mensagem…" aria-label="Responder" required />
              <FormError error={erro} />
              <button type="submit" className="pdp__cta" disabled={enviando || !resposta.trim()}>
                <Send size={14} aria-hidden="true" /> {enviando ? 'Enviando…' : 'Enviar'}
              </button>
            </form>
          )}
        </div>
      )}
    </li>
  )
}

// Todo chamado é sobre um pedido do próprio cliente
function NovoChamado({ acesso, pedidos, pedidoInicial, onCriado }) {
  const tipos = (useAsync(() => cadastrosService.listarTiposSolicitacao(), []).data ?? []).filter((t) => POS_VENDA.includes(t.categoria))
  const [numero, setNumero] = useState(pedidoInicial || pedidos[0]?.numero || '')
  const [tipoId, setTipoId] = useState('')
  const [descricao, setDescricao] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState(null)

  if (!pedidos.length) return <p className="orders__empty">Os chamados são sempre sobre um pedido, e ainda não há pedidos neste e-mail.</p>

  const enviar = async (e) => {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      const { id } = await pedidosService.abrirSolicitacao({ ...acesso, numero, tipoSolicitacaoId: Number(tipoId), descricao })
      onCriado(id)
    } catch (error) {
      setErro(error)
      setEnviando(false)
    }
  }

  return (
    <form className="ticket-new" onSubmit={enviar}>
      <p className="ticket-new__intro">Conte o que aconteceu. Nossa equipe responde aqui, em Minhas solicitações, e avisa por e-mail.</p>
      <SeletorPedido pedidos={pedidos} value={numero} onChange={setNumero} />
      <label className="co-field">
        <span>Assunto</span>
        <select value={tipoId} onChange={(e) => setTipoId(e.target.value)} required>
          <option value="">Selecione</option>
          {tipos.map((t) => (
            <option key={t.id} value={t.id}>
              {t.titulo}
            </option>
          ))}
        </select>
      </label>
      <label className="co-field">
        <span>Descrição</span>
        <textarea
          rows={5}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Ex.: o tamanho ficou pequeno e quero trocar pelo M."
          required
          minLength={10}
        />
      </label>
      <FormError error={erro} />
      <button type="submit" className="pdp__cta" disabled={enviando || !tipoId || descricao.trim().length < 10}>
        {enviando ? 'Enviando…' : 'Abrir chamado'}
      </button>
    </form>
  )
}
