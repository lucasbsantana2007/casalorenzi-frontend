import { ChevronDown, CircleAlert, RotateCcw, Send, ThumbsDown, ThumbsUp, X } from 'lucide-react'
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { BlocosChat } from './BlocosChat'

const LIMITE = 800

// O modelo às vezes marca negrito com **: vira <strong>, em vez de asteriscos na tela. O resto continua texto
// puro (o React escapa tudo, então nada do texto vira HTML).
function TextoDaResposta({ valor }) {
  return valor.split(/\*\*(.+?)\*\*/g).map((parte, i) => (i % 2 ? <strong key={i}>{parte}</strong> : parte))
}

// "Ajudou?" na última resposta da Lúcia (decisão 104). No "não ajudou", pergunta o que faltou (opcional): é o que a
// equipe lê no Uso da IA para melhorar as respostas
function AvaliarResposta({ mensagem, avaliar }) {
  const [etapa, setEtapa] = useState(mensagem.avaliacao ? 'oculta' : 'perguntar') // perguntar | comentar | obrigada | oculta
  const [comentario, setComentario] = useState('')
  if (etapa === 'oculta') return null
  if (etapa === 'obrigada') return <p className="chat-sutil chat-avaliacao">Obrigada pelo retorno!</p>
  if (etapa === 'comentar') {
    return (
      <form
        className="chat-avaliacao chat-avaliacao--comentario"
        onSubmit={(e) => {
          e.preventDefault()
          if (comentario.trim()) avaliar(mensagem.id, 'NAO_AJUDOU', comentario.trim())
          setEtapa('obrigada')
        }}
      >
        <label className="chat-sutil" htmlFor={`faltou-${mensagem.id}`}>
          O que faltou nesta resposta? (opcional)
        </label>
        <textarea id={`faltou-${mensagem.id}`} rows={2} value={comentario} onChange={(e) => setComentario(e.target.value.slice(0, 500))} />
        <div className="chat-avaliacao__acoes">
          <button type="submit" className="chat-link chat-link--forte">
            Enviar
          </button>
          <button type="button" className="chat-link" onClick={() => setEtapa('obrigada')}>
            Pular
          </button>
        </div>
      </form>
    )
  }
  return (
    <div className="chat-avaliacao" role="group" aria-label="Esta resposta ajudou?">
      <span className="chat-sutil">Ajudou?</span>
      <button
        type="button"
        className="chat-avaliacao__botao"
        title="Ajudou"
        aria-label="Ajudou"
        onClick={() => {
          avaliar(mensagem.id, 'AJUDOU')
          setEtapa('obrigada')
        }}
      >
        <ThumbsUp size={14} strokeWidth={1.8} aria-hidden="true" />
      </button>
      <button
        type="button"
        className="chat-avaliacao__botao"
        title="Não ajudou"
        aria-label="Não ajudou"
        onClick={() => {
          avaliar(mensagem.id, 'NAO_AJUDOU')
          setEtapa('comentar')
        }}
      >
        <ThumbsDown size={14} strokeWidth={1.8} aria-hidden="true" />
      </button>
    </div>
  )
}

// Janela de conversa do assistente do site (carregada só quando o cliente abre o chat: as fotos e os
// blocos não pesam no carregamento das páginas).
// Enquanto a Lúcia responde (2 a 4 s com consulta): diz o que ela está fazendo, pelo assunto da pergunta, em vez
// de só três pontinhos; se demorar, avisa que falta pouco
const ASSUNTOS = [
  [/pedido|rastreio|reembolso|estorno|devolu|cancel|ponto|lupe|extrato|solicita|e-?mail/i, 'Consultando a sua conta…'],
  [/frete|cep|entrega/i, 'Calculando o frete…'],
  [/loja|hor[aá]rio|abre|fecha|endere/i, 'Vendo as lojas…'],
]

function Procurando({ pergunta = '' }) {
  const [demorou, setDemorou] = useState(false)
  useEffect(() => {
    const relogio = setTimeout(() => setDemorou(true), 4000)
    return () => clearTimeout(relogio)
  }, [])
  const texto = demorou ? 'Só mais um instante…' : (ASSUNTOS.find(([padrao]) => padrao.test(pergunta))?.[1] ?? 'Procurando no catálogo…')
  return (
    <div className="chat-msg chat-msg--assistente chat-digitando" role="status" aria-label={`A Lúcia está respondendo: ${texto}`}>
      <span />
      <span />
      <span />
      <small className="chat-digitando__texto">{texto}</small>
    </div>
  )
}

export function PainelChat({ assistente, onFechar }) {
  const {
    mensagens,
    status,
    enviando,
    erro,
    enviar,
    repetir,
    novaConversa,
    confirmarSacola,
    desfazerSacola,
    concluirAcao,
    avaliar,
    encaminhar,
    entrar,
    logado,
  } = assistente
  const [texto, setTexto] = useState('')
  const campoRef = useRef(null)
  const painelRef = useRef(null)
  const listaRef = useRef(null)
  const novaRef = useRef(null)
  // Última mensagem já mostrada: o que chega depois dela é novo (null = a conversa ainda não abriu)
  const ultimaVista = useRef(null)
  // Resposta longa que acabou de chegar: a marca "Nova resposta" vai antes dela e o chat para no começo dela
  const [novaId, setNovaId] = useState(null)
  const [longeDoFim, setLongeDoFim] = useState(false)

  const irParaOFim = (suave = false) => {
    const lista = listaRef.current
    lista?.scrollTo({ top: lista.scrollHeight, behavior: suave ? 'smooth' : 'auto' })
  }

  // Como no WhatsApp: a pergunta e o "digitando" levam ao fim; a resposta nova é lida a partir do começo
  useLayoutEffect(() => {
    const ultima = mensagens.at(-1)
    const chegouResposta =
      ultimaVista.current !== null && ultima?.papel === 'ASSISTENTE' && ultima.id !== ultimaVista.current && !enviando
    if (ultima) ultimaVista.current = ultima.id
    if (chegouResposta) setNovaId(ultima.id)
    else irParaOFim()
  }, [mensagens, enviando, erro])

  // Depois que a marca aparece: resposta que não cabe na tela para no começo; a que cabe, vai até o fim (sem marca)
  useLayoutEffect(() => {
    const lista = listaRef.current
    const marca = novaRef.current
    if (!novaId || !lista || !marca) return
    const resposta = marca.nextElementSibling
    const altura = marca.offsetHeight + (resposta?.offsetHeight ?? 0) + 16
    if (altura <= lista.clientHeight) {
      setNovaId(null)
      irParaOFim()
    } else {
      lista.scrollTop = marca.offsetTop - 8
    }
  }, [novaId])

  const aoRolar = () => {
    const lista = listaRef.current
    if (lista) setLongeDoFim(lista.scrollHeight - lista.scrollTop - lista.clientHeight > 120)
  }

  // Quando a área da conversa encolhe (o teclado do celular abriu), a parte de baixo continua à vista,
  // como no WhatsApp: o que estava logo acima do campo segue logo acima do campo
  useEffect(() => {
    const lista = listaRef.current
    if (!lista || typeof ResizeObserver === 'undefined') return
    let altura = lista.clientHeight
    const observador = new ResizeObserver(() => {
      const nova = lista.clientHeight
      if (nova < altura) lista.scrollTop += altura - nova
      altura = nova
    })
    observador.observe(lista)
    return () => observador.disconnect()
  }, [])

  useEffect(() => {
    campoRef.current?.focus()
    const aoTeclar = (e) => e.key === 'Escape' && onFechar()
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [onFechar])

  const mandar = (valor = texto, acao) => {
    if (!valor.trim() || enviando) return
    setNovaId(null)
    enviar(valor, acao)
    setTexto('')
  }

  const acoes = {
    enviar: (valor) => mandar(valor),
    enviando,
    escolherProduto: (p) => mandar(`Quero a ${p.nome}`, { tipo: 'FOCAR_PRODUTO', produtoId: p.produtoId }),
    confirmarSacola,
    desfazerSacola,
    concluirAcao,
    encaminhar,
    entrar,
    logado,
  }
  const ultimaDoAssistente = [...mensagens].reverse().find((m) => m.papel === 'ASSISTENTE')?.id

  return (
    <section className="chat" role="dialog" aria-label="Lúcia, assistente virtual" ref={painelRef}>
      <header className="chat__topo">
        <div>
          <h2 className="chat__titulo">Assistente Lucia</h2>
          <p className="chat__subtitulo">Casa Lorenzi · Vulto</p>
        </div>
        <div className="chat__acoes">
          <button type="button" className="chat__icone" onClick={novaConversa} title="Nova conversa" aria-label="Começar uma nova conversa" disabled={enviando}>
            <RotateCcw size={16} strokeWidth={1.6} />
          </button>
          <button type="button" className="chat__icone" onClick={onFechar} aria-label="Fechar a Lúcia">
            <X size={18} strokeWidth={1.6} />
          </button>
        </div>
      </header>

      <div className="chat__mensagens" aria-live="polite" ref={listaRef} onScroll={aoRolar}>
        {status === 'carregando' && <p className="chat-sutil chat__centro">Abrindo a conversa…</p>}
        {mensagens.map((m) =>
          m.papel === 'USUARIO' ? (
            <div key={m.id} className="chat-msg chat-msg--usuario">
              <p>{m.texto}</p>
            </div>
          ) : m.papel === 'ASSISTENTE' ? (
            <Fragment key={m.id}>
              {m.id === novaId && (
                <p className="chat-nova" ref={novaRef} role="status">
                  <span>Nova resposta</span>
                </p>
              )}
              <div className="chat-msg chat-msg--assistente">
                {m.texto && (
                  <p>
                    <TextoDaResposta valor={m.texto} />
                  </p>
                )}
                {m.modo === 'CONTINGENCIA' && <p className="chat-sutil">Resposta automática: o assistente inteligente está indisponível agora.</p>}
                <BlocosChat mensagem={m} ultima={m.id === ultimaDoAssistente} acoes={acoes} />
                {m.id === ultimaDoAssistente && m.avaliavel && !enviando && <AvaliarResposta key={m.id} mensagem={m} avaliar={avaliar} />}
              </div>
            </Fragment>
          ) : null,
        )}
        {enviando && <Procurando pergunta={[...mensagens].reverse().find((m) => m.papel === 'USUARIO')?.texto} />}
        {erro && (
          <div className="chat-erro" role="alert">
            <CircleAlert size={16} aria-hidden="true" />
            <span>{erro.mensagem}</span>
            <button type="button" className="chat-link chat-link--forte" onClick={repetir}>
              Tentar de novo
            </button>
          </div>
        )}
        {longeDoFim && (
          <button type="button" className="chat-ir-fim" onClick={() => irParaOFim(true)} aria-label="Ir para o fim da conversa">
            <ChevronDown size={18} strokeWidth={1.8} />
          </button>
        )}
      </div>

      <form
        className="chat__entrada"
        onSubmit={(e) => {
          e.preventDefault()
          mandar()
        }}
      >
        <textarea
          ref={campoRef}
          value={texto}
          onChange={(e) => setTexto(e.target.value.slice(0, LIMITE))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              mandar()
            }
          }}
          rows={1}
          placeholder="Escreva sua pergunta"
          aria-label="Sua mensagem"
          disabled={status !== 'pronta'}
        />
        <button type="submit" className="chat__enviar" disabled={!texto.trim() || enviando || status !== 'pronta'} aria-label="Enviar">
          <Send size={16} strokeWidth={1.8} />
        </button>
      </form>
      <p className="chat__rodape">Respostas com os dados do site. Para comprar, use a sacola.</p>
    </section>
  )
}
