import { CircleAlert, MessageSquarePlus, Send } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertasPainel } from '../../components/copiloto/AlertasPainel'
import { BlocosCopiloto, TextoResposta } from '../../components/copiloto/BlocosCopiloto'
import { ConectarClaude } from '../../components/copiloto/ConectarClaude'
import { UsoIA } from '../../components/copiloto/UsoIA'
import { PageHeader } from '../../components/ui/PageHeader'
import { Tabs } from '../../components/ui/Tabs'
import { useAsync } from '../../hooks/useAsync'
import { useSession } from '../../hooks/useSession'
import { copilotoService } from '../../services/copilotoService'
import { formatDateTime } from '../../utils/format'

const novoId = () => (globalThis.crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`)

// Inteligência de Negócios — Assistente IA: perguntas em linguagem natural sobre vendas, estoque, transferências
// e Lupe+, respondidas com consultas controladas (somente leitura) e as regras oficiais da plataforma.
export function InteligenciaPage() {
  const { pode } = useSession()
  const [searchParams, setSearchParams] = useSearchParams()
  const aba = searchParams.get('aba') ?? 'assistente'
  const abas = [
    { value: 'assistente', label: 'Assistente' },
    { value: 'alertas', label: 'Alertas' },
    { value: 'conectar', label: 'Conectar ao Claude' },
    ...(pode('administracao') ? [{ value: 'uso', label: 'Uso e custo da IA' }] : []),
  ]
  return (
    <>
      <PageHeader
        eyebrow="Inteligência de Negócios"
        title="Assistente IA"
        description="Pergunte sobre vendas, estoque, transferências e Lupe+. Cada número vem de uma consulta aos dados reais, com o período, os filtros e a definição usados."
      />
      <Tabs items={abas} value={aba} onChange={(valor) => setSearchParams(valor === 'assistente' ? {} : { aba: valor }, { replace: true })} label="Seções" />
      <div className="cop-conteudo">
        {aba === 'alertas' ? (
          <AlertasPainel />
        ) : aba === 'conectar' ? (
          <ConectarClaude />
        ) : aba === 'uso' && pode('administracao') ? (
          <UsoIA />
        ) : (
          <Copiloto />
        )}
      </div>
    </>
  )
}

function Copiloto() {
  const sugestoes = useAsync(() => copilotoService.sugestoes(), [])
  const historico = useAsync(() => copilotoService.conversas(), [])
  const [conversaId, setConversaId] = useState(null)
  const [mensagens, setMensagens] = useState([])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState(null)
  const fimRef = useRef(null)

  useEffect(() => {
    const lista = fimRef.current?.parentElement
    lista?.scrollTo({ top: lista.scrollHeight, behavior: 'smooth' })
  }, [mensagens.length, enviando])

  const perguntar = useCallback(
    async (pergunta = texto) => {
      const limpo = pergunta.trim()
      if (!limpo || enviando) return
      setTexto('')
      setErro(null)
      setEnviando(true)
      const idCliente = novoId()
      const provisoria = { id: `local-${idCliente}`, papel: 'USUARIO', texto: limpo, blocos: [] }
      setMensagens((atual) => [...atual, provisoria])
      try {
        let id = conversaId
        if (!id) {
          id = (await copilotoService.abrir()).id
          setConversaId(id)
        }
        let resultado
        try {
          resultado = await copilotoService.perguntar(id, { texto: limpo, idCliente })
        } catch (e) {
          if (e.status !== 404 && e.status !== 410) throw e
          id = (await copilotoService.abrir()).id
          setConversaId(id)
          resultado = await copilotoService.perguntar(id, { texto: limpo, idCliente })
        }
        setMensagens((atual) => [...atual.filter((m) => m.id !== provisoria.id), resultado.pergunta, resultado.resposta])
        historico.reload()
      } catch (e) {
        setMensagens((atual) => atual.filter((m) => m.id !== provisoria.id))
        setErro({ mensagem: e.status === 429 ? 'Muitas perguntas seguidas. Aguarde alguns minutos.' : e.message, texto: limpo })
      } finally {
        setEnviando(false)
      }
    },
    [texto, enviando, conversaId, historico],
  )

  const abrirConversa = async (id) => {
    setErro(null)
    try {
      const dados = await copilotoService.obter(id)
      setConversaId(id)
      setMensagens(dados.mensagens.filter((m) => m.papel !== 'SISTEMA'))
    } catch (e) {
      setErro({ mensagem: e.message })
    }
  }

  const nova = () => {
    setConversaId(null)
    setMensagens([])
    setErro(null)
  }

  const exemplos = sugestoes.data?.sugestoes ?? []
  const ultima = [...mensagens].reverse().find((m) => m.papel === 'ASSISTENTE')?.id
  const vazio = mensagens.filter((m) => m.papel === 'USUARIO').length === 0
  const perm = sugestoes.data?.permissoes
  const permissoes = perm
    ? [
        perm.vendas && 'vendas',
        perm.fidelidade && 'Lupe+',
        perm.pedidos && 'pedidos',
        perm.atendimento && 'atendimentos',
        perm.estoque && 'estoque',
        perm.transferencias && 'transferências',
      ]
        .filter(Boolean)
        .join(', ')
    : ''

  return (
    <div className="cop">
      <section className="cop-chat" aria-label="Conversa com o assistente">
        <header className="chat__topo">
          <div>
            <h2 className="chat__titulo">Assistente IA</h2>
            <p className="chat__subtitulo">
              {sugestoes.data?.modoIA === 'REGRAS' ? 'Modo regras · ' : ''}Dados reais da plataforma · somente leitura
            </p>
          </div>
          <div className="chat__acoes">
            <button type="button" className="chat__icone" onClick={nova} title="Nova conversa" aria-label="Começar uma nova conversa" disabled={enviando}>
              <MessageSquarePlus size={17} strokeWidth={1.7} />
            </button>
          </div>
        </header>

        <div className="chat__mensagens cop-chat__mensagens" aria-live="polite">
          {vazio && (
            <div className="cop-inicio">
              <div className="chat-msg chat-msg--assistente">
                <p>
                  Olá! Pergunte sobre {permissoes || 'os dados da plataforma'}.{' '}
                  {perm?.vendas ? 'Respondo com os números reais, com o mesmo faturamento da tela Financeiro.' : 'Respondo com os dados reais da plataforma.'}
                </p>
              </div>
              {exemplos.length > 0 && (
                <div className="cop-sugestoes">
                  {exemplos.slice(0, 4).map((s) => (
                    <button key={s} type="button" className="cop-chip" onClick={() => perguntar(s)} disabled={enviando}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {mensagens.map((m) =>
            m.papel === 'USUARIO' ? (
              <div key={m.id} className="chat-msg chat-msg--usuario">
                <p>{m.texto}</p>
              </div>
            ) : (
              <div key={m.id} className="cop-msg">
                <div className="cop-bolha">
                  <div className="cop-resposta__texto">
                    <TextoResposta texto={m.texto} />
                    {m.modo === 'CONTINGENCIA' && <p className="cop-sutil">Resposta automática: o modelo de linguagem não respondeu e as regras assumiram.</p>}
                  </div>
                  <BlocosCopiloto blocos={m.blocos} ultima={m.id === ultima} onPerguntar={perguntar} desabilitado={enviando} />
                </div>
              </div>
            ),
          )}

          {enviando && (
            <div className="chat-msg chat-msg--assistente chat-digitando" role="status" aria-label="Consultando os dados">
              <span />
              <span />
              <span />
            </div>
          )}
          {erro && (
            <div className="chat-erro" role="alert">
              <CircleAlert size={16} aria-hidden="true" />
              <span>{erro.mensagem}</span>
              {erro.texto && (
                <button type="button" className="chat-link chat-link--forte" onClick={() => perguntar(erro.texto)}>
                  Tentar de novo
                </button>
              )}
            </div>
          )}
          <div ref={fimRef} />
        </div>

        <form
          className="chat__entrada cop-chat__entrada"
          onSubmit={(e) => {
            e.preventDefault()
            perguntar()
          }}
        >
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value.slice(0, 1500))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                perguntar()
              }
            }}
            rows={1}
            placeholder="Ex.: Qual loja faturou mais em setembro?"
            aria-label="Sua pergunta"
          />
          <button type="submit" className="chat__enviar" disabled={!texto.trim() || enviando} aria-label="Enviar">
            <Send size={16} strokeWidth={1.8} />
          </button>
        </form>
      </section>

      <aside className="cop__lado">
        <div className="card">
          <div className="card__header">
            <h2 className="card__title">Conversas</h2>
            <button type="button" className="btn btn-ghost btn-sm" onClick={nova}>
              <MessageSquarePlus size={14} aria-hidden="true" /> Nova
            </button>
          </div>
          <ul className="cop-historico">
            {(historico.data ?? []).map((c) => (
              <li key={c.id}>
                <button type="button" className={c.id === conversaId ? 'is-active' : undefined} onClick={() => abrirConversa(c.id)}>
                  <span>{c.titulo ?? 'Conversa'}</span>
                  <small>
                    {formatDateTime(c.atualizadaEm)} · {c.perguntas} pergunta{c.perguntas === 1 ? '' : 's'}
                  </small>
                </button>
              </li>
            ))}
            {historico.data?.length === 0 && <li className="cop-sutil">Nenhuma conversa ainda.</li>}
          </ul>
        </div>
      </aside>
    </div>
  )
}
