import { BellRing, ChevronDown, Coins, FlaskConical, Info, Send, Settings2, ShoppingBag, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { useAsync } from '../../hooks/useAsync'
import { copilotoService } from '../../services/copilotoService'
import { formatDateTime, formatNumber } from '../../utils/format'
import { AsyncContent } from '../ui/AsyncContent'
import { EmptyState } from '../ui/EmptyState'
import { StatusBadge } from '../ui/StatusBadge'

// Aba Automações (decisão 127, backend: src/use_cases/emails_clientes.py): os e-mails automáticos aos clientes, por
// regras e sem IA. Cada envio só sai se estiver ligado no servidor; no modo teste, tudo vai para o e-mail do time.
// O botão roda todas as automações: os e-mails e as rotinas internas, que mantêm em dia os alertas do Assistente IA.
const EMAILS = {
  aviso_pontos: {
    titulo: 'Pontos a vencer',
    // No meio da frase: "3 de pontos a vencer"
    naFrase: 'de pontos a vencer',
    icone: Coins,
    texto: 'Avisa 30 dias antes de os pontos Lupe+ vencerem. É um aviso de serviço: não depende de aceitar e-mails de novidades.',
  },
  lembrete_sacola: {
    titulo: 'Sacola abandonada',
    naFrase: 'de sacola abandonada',
    icone: ShoppingBag,
    texto: 'Lembra quem deixou peças na sacola há mais de 1 hora. Só para quem aceita receber e-mails.',
  },
  aviso_estoque: {
    titulo: 'Avise-me',
    naFrase: 'do Avise-me',
    icone: BellRing,
    texto: 'Avisa quem pediu "Avise-me quando chegar" assim que a peça volta ao estoque do site.',
  },
}

const ROTINAS = {
  estoque_baixo: 'Alertas de estoque baixo',
  estoque_parado: 'Alertas de estoque parado',
  sugestoes_transferencia: 'Sugestões de transferência',
  pontos_a_vencer: 'Resumo dos pontos a vencer',
  limpeza_conversas: 'Limpeza das conversas',
  encerrar_whatsapp: 'Atendimentos do WhatsApp',
}

const plural = (n, um, varios) => `${formatNumber(n)} ${n === 1 ? um : varios}`

// O que aconteceu no clique, em uma frase
function resumir(execucoes) {
  const dosEmails = execucoes.filter((e) => e.automacao in EMAILS)
  if (dosEmails.length > 0 && dosEmails.every((e) => e.status === 'IGNORADA')) {
    return { tom: 'info', texto: 'Os e-mails rodaram há menos de um minuto. Espere um pouco para rodar de novo.' }
  }
  const sucesso = dosEmails.filter((e) => e.status === 'SUCESSO')
  const total = sucesso.reduce((soma, e) => soma + e.criados, 0)
  const desligados = sucesso.filter((e) => e.detalhe?.includes('desligado')).length
  const falhas = dosEmails.filter((e) => e.status === 'ERRO').map((e) => EMAILS[e.automacao].titulo)
  let texto
  if (total > 0) {
    const partes = sucesso.filter((e) => e.criados > 0).map((e) => `${formatNumber(e.criados)} ${EMAILS[e.automacao].naFrase}`)
    texto = `${plural(total, 'e-mail enviado', 'e-mails enviados')} agora: ${partes.join(', ')}.`
  } else if (desligados === dosEmails.length) {
    texto = 'Nenhum e-mail saiu: os envios estão desligados no servidor.'
  } else {
    texto = 'Nenhum e-mail saiu: não havia cliente na fila dos envios ligados.'
  }
  if (falhas.length > 0) texto += ` O envio de ${falhas.join(' e ')} falhou: detalhes no log da API.`
  if (execucoes.some((e) => !(e.automacao in EMAILS) && e.status === 'ERRO')) texto += ' Uma rotina interna falhou (veja Rotinas internas).'
  return { tom: falhas.length > 0 ? 'erro' : total > 0 ? 'sucesso' : 'info', texto }
}

function AvisoDoModo({ emails, resend }) {
  const ligados = emails.filter((e) => e.ligado)
  const reais = ligados.filter((e) => e.modo === 'REAL')
  const teste = ligados.find((e) => e.modo === 'TESTE')
  const avisos = []
  if (ligados.length === 0) {
    avisos.push({
      tom: 'neutro',
      icone: Info,
      texto: (
        <>
          Os três envios estão <strong>desligados</strong> no servidor. Para ligar, defina a variável de cada um como <code>true</code> no Render.
        </>
      ),
    })
  }
  if (teste) {
    avisos.push({
      tom: 'teste',
      icone: FlaskConical,
      texto: (
        <>
          <strong>Modo teste:</strong> os e-mails vão para <strong>{teste.testePara}</strong>, com o cliente no assunto, no máximo{' '}
          {formatNumber(teste.limiteDia)} por tipo por dia.
        </>
      ),
    })
  }
  if (reais.length > 0) {
    avisos.push({
      tom: 'real',
      icone: TriangleAlert,
      texto: (
        <>
          <strong>Modo real:</strong> {reais.map((e) => EMAILS[e.nome].titulo).join(', ')} vão para o e-mail dos clientes que criaram conta
          no site. A base migrada e as contas de demonstração não recebem.
        </>
      ),
    })
  }
  if (!resend) {
    avisos.push({
      tom: 'real',
      icone: TriangleAlert,
      texto: 'Este servidor está sem a chave do Resend: os e-mails não saem de verdade, só aparecem no log da API.',
    })
  }
  return avisos.map(({ tom, icone: Icone, texto }) => (
    <p key={tom + String(texto).slice(0, 12)} className={`cop-auto__modo cop-auto__modo--${tom}`}>
      <Icone size={16} aria-hidden="true" />
      <span>{texto}</span>
    </p>
  ))
}

function CartaoEmail({ email }) {
  const info = EMAILS[email.nome]
  const Icone = info.icone
  const cheio = email.ligado && email.enviadosHoje >= email.limiteDia
  return (
    <div className={`card cop-auto__email${email.ligado ? '' : ' is-desligado'}`}>
      <div className="cop-auto__email-topo">
        <span className="cop-auto__icone">
          <Icone size={18} strokeWidth={1.6} aria-hidden="true" />
        </span>
        <h3>{info.titulo}</h3>
        <StatusBadge
          tone={email.ligado ? (email.modo === 'TESTE' ? 'info' : 'success') : 'neutral'}
          label={email.ligado ? (email.modo === 'TESTE' ? 'Ligado · teste' : 'Ligado') : 'Desligado'}
        />
      </div>
      <p className="cop-sutil cop-auto__texto">{info.texto}</p>
      <dl className="cop-auto__numeros">
        <div>
          <dt>Na fila agora</dt>
          <dd>{formatNumber(email.naFila)}</dd>
        </div>
        <div>
          <dt>Enviados hoje</dt>
          <dd>
            {formatNumber(email.enviadosHoje)} <small>de {formatNumber(email.limiteDia)}</small>
          </dd>
        </div>
      </dl>
      <p className="cop-auto__rodape cop-sutil">
        {!email.ligado ? (
          <>
            Para ligar: <code>{email.chave}=true</code>
          </>
        ) : cheio ? (
          'Limite do dia atingido: segue amanhã.'
        ) : email.ultima ? (
          `Última execução: ${formatDateTime(email.ultima.terminadaEm)}`
        ) : (
          'Ainda não rodou.'
        )}
      </p>
    </div>
  )
}

function UltimosEnvios({ envios, desde }) {
  return (
    <div className="card">
      <div className="card__header">
        <div>
          <h2 className="card__title">Últimos e-mails enviados</h2>
          <p className="card__subtitle">Cada e-mail que saiu, do mais recente para o mais antigo</p>
        </div>
      </div>
      {envios.length === 0 ? (
        <div className="card__body">
          <EmptyState title="Nenhum e-mail enviado ainda" description="Quando um envio estiver ligado, cada e-mail que sair aparece aqui." />
        </div>
      ) : (
        <div className="table-wrap">
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Quando</th>
                  <th scope="col">E-mail</th>
                  <th scope="col">Cliente</th>
                  <th scope="col">Para</th>
                </tr>
              </thead>
              <tbody>
                {envios.map((e, i) => {
                  const novo = desde !== null && e.enviadoEm >= desde
                  return (
                    <tr key={`${e.tipo}-${e.enviadoEm}-${i}`} className={novo ? 'cop-auto__novo' : undefined}>
                      <td className="cop-auto__quando">
                        {formatDateTime(e.enviadoEm)} {novo && <StatusBadge tone="success" label="Novo" />}
                      </td>
                      <td>
                        <strong>{EMAILS[e.tipo]?.titulo ?? e.tipo}</strong>
                        <div className="cop-sutil">{e.resumo}</div>
                      </td>
                      <td>{e.cliente ?? <span className="cop-sutil">Cliente excluído</span>}</td>
                      <td>
                        {e.modo === 'TESTE' ? (
                          <>
                            <StatusBadge tone="info" label="Teste" /> <span className="cop-sutil">{e.para ?? 'e-mail do time'}</span>
                          </>
                        ) : (
                          e.para
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function RotinasInternas({ rotinas }) {
  const [aberto, setAberto] = useState(false)
  return (
    <>
      <div>
        <button
          type="button"
          className={`cop-mais${aberto ? ' is-aberto' : ''}`}
          onClick={() => setAberto((v) => !v)}
          aria-expanded={aberto}
          aria-controls="cop-auto-rotinas"
        >
          <Settings2 size={15} aria-hidden="true" />
          Rotinas internas (rodam junto com o botão)
          <ChevronDown size={16} aria-hidden="true" className="cop-mais__seta" />
        </button>
      </div>
      {aberto && (
        <div className="card" id="cop-auto-rotinas">
          <div className="card__header">
            <div>
              <h2 className="card__title">Rotinas internas</h2>
              <p className="card__subtitle">
                Não mandam e-mail. Mantêm em dia os alertas que o Assistente IA consulta (estoque, transferências e pontos), apagam as
                conversas antigas e encerram os atendimentos parados do WhatsApp.
              </p>
            </div>
          </div>
          <div className="table-wrap">
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Rotina</th>
                    <th scope="col">Última execução</th>
                    <th scope="col">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {rotinas.map((r) => (
                    <tr key={r.nome}>
                      <td>
                        <strong>{ROTINAS[r.nome] ?? r.nome}</strong>
                        <div className="cop-sutil">{r.descricao}</div>
                      </td>
                      <td>{r.ultima ? formatDateTime(r.ultima.terminadaEm) : 'Nunca rodou'}</td>
                      <td>{r.ultima ? `${r.ultima.status} · ${r.ultima.detalhe}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// No modo real os e-mails vão para os clientes: o botão pede confirmação antes. No modo teste, manda direto.
function BotaoEnviar({ real, rodando, onEnviar }) {
  const [confirmar, setConfirmar] = useState(false)
  if (confirmar) {
    return (
      <div className="cop-auto__confirmar" role="group" aria-label="Confirmar o envio">
        <span>Os e-mails vão para os clientes de verdade (quem criou conta no site).</span>
        <button
          type="button"
          className="btn btn-danger"
          onClick={() => {
            setConfirmar(false)
            onEnviar()
          }}
        >
          Confirmar envio
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setConfirmar(false)}>
          Cancelar
        </button>
      </div>
    )
  }
  return (
    <button type="button" className="btn btn-primary" onClick={() => (real ? setConfirmar(true) : onEnviar())} disabled={rodando}>
      <Send size={15} aria-hidden="true" /> {rodando ? 'Enviando…' : 'Enviar e-mails agora'}
    </button>
  )
}

export function AutomacoesEmails() {
  const state = useAsync(() => copilotoService.emailsAutomaticos(), [])
  const [rodando, setRodando] = useState(false)
  const [resultado, setResultado] = useState(null)
  // Início do último clique (hora do servidor): os e-mails que saíram depois dele ganham o selo "Novo"
  const [desde, setDesde] = useState(null)

  const executar = async () => {
    setRodando(true)
    setResultado(null)
    try {
      const execucoes = await copilotoService.executarAutomacoes()
      const inicios = execucoes.map((e) => e.iniciadaEm).filter(Boolean)
      if (inicios.length > 0) setDesde(Math.min(...inicios))
      setResultado(resumir(execucoes))
      state.reload()
    } catch (e) {
      setResultado({ tom: 'erro', texto: e.message })
    } finally {
      setRodando(false)
    }
  }

  return (
    <AsyncContent state={state} isEmpty={() => false} loadingLabel="Carregando as automações…">
      {(painel) => (
        <div className="cop-auto">
          <div className="cop-auto__topo">
            <div>
              <h2 className="cop-auto__titulo">E-mails automáticos aos clientes</h2>
              <p className="cop-sutil">Regras simples, sem IA: cada cliente recebe cada aviso uma vez, e nada sai sem estar ligado no servidor.</p>
            </div>
            <BotaoEnviar real={painel.emails.some((e) => e.ligado && e.modo === 'REAL')} rodando={rodando} onEnviar={executar} />
          </div>

          <AvisoDoModo emails={painel.emails} resend={painel.resend} />
          {resultado && (
            <p className={`cop-aviso cop-aviso--${resultado.tom}`} role="status">
              {resultado.texto}
            </p>
          )}

          <div className="cop-auto__cards">
            {painel.emails.map((email) => (
              <CartaoEmail key={email.nome} email={email} />
            ))}
          </div>

          <UltimosEnvios envios={painel.envios} desde={desde} />
          <RotinasInternas rotinas={painel.rotinas} />
        </div>
      )}
    </AsyncContent>
  )
}
