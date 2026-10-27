import { CircleAlert, RotateCcw, Send, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { BlocosChat } from './BlocosChat'

const LIMITE = 800

// O modelo às vezes marca negrito com **: vira <strong>, em vez de asteriscos na tela. O resto continua texto
// puro (o React escapa tudo, então nada do texto vira HTML).
function TextoDaResposta({ valor }) {
  return valor.split(/\*\*(.+?)\*\*/g).map((parte, i) => (i % 2 ? <strong key={i}>{parte}</strong> : parte))
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
  const { mensagens, status, enviando, erro, enviar, repetir, novaConversa, confirmarSacola, desfazerSacola, concluirAcao, encaminhar, entrar, logado } = assistente
  const [texto, setTexto] = useState('')
  const fimRef = useRef(null)
  const campoRef = useRef(null)
  const painelRef = useRef(null)

  useEffect(() => {
    fimRef.current?.scrollIntoView({ block: 'end' })
  }, [mensagens.length, enviando, erro])

  useEffect(() => {
    campoRef.current?.focus()
    const aoTeclar = (e) => e.key === 'Escape' && onFechar()
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [onFechar])

  const mandar = (valor = texto, acao) => {
    if (!valor.trim() || enviando) return
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
          <h2 className="chat__titulo">Lúcia</h2>
          <p className="chat__subtitulo">Assistente virtual · Casa Lorenzi · Vulto</p>
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

      <div className="chat__mensagens" aria-live="polite">
        {status === 'carregando' && <p className="chat-sutil chat__centro">Abrindo a conversa…</p>}
        {mensagens.map((m) =>
          m.papel === 'USUARIO' ? (
            <div key={m.id} className="chat-msg chat-msg--usuario">
              <p>{m.texto}</p>
            </div>
          ) : m.papel === 'ASSISTENTE' ? (
            <div key={m.id} className="chat-msg chat-msg--assistente">
              {m.texto && (
                <p>
                  <TextoDaResposta valor={m.texto} />
                </p>
              )}
              {m.modo === 'CONTINGENCIA' && <p className="chat-sutil">Resposta automática: o assistente inteligente está indisponível agora.</p>}
              <BlocosChat mensagem={m} ultima={m.id === ultimaDoAssistente} acoes={acoes} />
            </div>
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
        <div ref={fimRef} />
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
          placeholder="Pergunte sobre peças, lojas ou seus pontos"
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
