import { Check, Clock, Headset, LogIn, MapPin, MessageCircle, Phone, ShoppingBag } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { MODO_DEMO } from '../../config/env'
import { CLIENTE_DEMO, SENHA_DEMO } from '../../context/perfisDemo'
import { imagemDoProduto } from '../../data/imagensProdutos'
import { loginDaMarca, marcaDoCaminho } from '../../data/marcas'
import { formatCurrency, formatDate, formatNumber } from '../../utils/format'

// O que o assistente mostra além do texto. Tudo vem das consultas do backend (preço, estoque, pontos),
// nunca do texto do modelo de linguagem.

const SITUACAO = {
  DISPONIVEL: { rotulo: 'Disponível', classe: 'ok' },
  ULTIMAS_UNIDADES: { rotulo: 'Últimas unidades', classe: 'alerta' },
  ESGOTADO: { rotulo: 'Indisponível', classe: 'off' },
}

function Situacao({ valor }) {
  const s = SITUACAO[valor] ?? SITUACAO.ESGOTADO
  return <span className={`chat-situacao chat-situacao--${s.classe}`}>{s.rotulo}</span>
}

function Produtos({ itens, onEscolher }) {
  return (
    <ul className="chat-produtos" aria-label="Peças encontradas">
      {itens.map((p) => (
        <li key={p.produtoId} className="chat-produto">
          <Link to={p.link} className="chat-produto__foto">
            <img src={imagemDoProduto({ ...p, id: p.produtoId }, p.cores?.[0])} alt={p.nome} loading="lazy" />
          </Link>
          <div className="chat-produto__info">
            <Link to={p.link} className="chat-produto__nome">
              {p.nome}
            </Link>
            <span className="chat-produto__preco">{formatCurrency(p.preco)}</span>
            <span className="chat-produto__meta">{p.cores?.join(' · ')}</span>
            {p.tamanhos?.length > 0 && <span className="chat-produto__meta">Tamanhos: {p.tamanhos.join(', ')}</span>}
            {p.situacao === 'ULTIMAS_UNIDADES' && <Situacao valor={p.situacao} />}
          </div>
          <div className="chat-produto__acoes">
            <Link to={p.link} className="chat-link">
              Ver peça
            </Link>
            {onEscolher && (
              <button type="button" className="chat-link chat-link--forte" onClick={() => onEscolher(p)}>
                Quero esta
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

function Disponibilidade({ bloco }) {
  const escolha = [bloco.cor, bloco.tamanho && `tamanho ${bloco.tamanho}`].filter(Boolean).join(', ')
  return (
    <div className="chat-card">
      <p className="chat-card__titulo">
        Disponibilidade{escolha ? ` · ${escolha}` : ''}
      </p>
      <ul className="chat-lista">
        <li>
          <span>Site</span>
          <Situacao valor={bloco.site} />
        </li>
        {bloco.lojas.map((loja) => (
          <li key={loja.lojaId}>
            <span>
              {loja.loja} <small>{loja.cidade}</small>
            </span>
            <Situacao valor={loja.situacao} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function Lojas({ itens }) {
  return (
    <ul className="chat-lojas">
      {itens.map((loja) => (
        <li key={loja.lojaId} className="chat-card">
          <p className="chat-card__titulo">{loja.nome}</p>
          {loja.endereco && (
            <p className="chat-icone">
              <MapPin size={14} aria-hidden="true" /> {loja.endereco}
            </p>
          )}
          {loja.horarios?.length > 0 && (
            <p className="chat-icone">
              <Clock size={14} aria-hidden="true" /> {loja.horarios.join(' · ')}
            </p>
          )}
          {loja.telefone && (
            <p className="chat-icone">
              <Phone size={14} aria-hidden="true" /> <a href={`tel:${loja.telefone.replace(/[^\d+]/g, '')}`}>{loja.telefone}</a>
            </p>
          )}
        </li>
      ))}
    </ul>
  )
}

function Pontos({ bloco }) {
  return (
    <div className="chat-card">
      <p className="chat-card__titulo">Helo</p>
      <p className="chat-pontos">
        <strong>{formatNumber(bloco.saldo)}</strong> pontos <span>({formatCurrency(bloco.valorEmReais)} em desconto)</span>
      </p>
      {bloco.categoria && <p>Categoria {bloco.categoria}</p>}
      {bloco.aVencer?.length > 0 && (
        <p className="chat-sutil">
          Vencem: {bloco.aVencer.map((v) => `${formatNumber(v.pontos)} em ${formatDate(`${v.data}T12:00:00`)}`).join(' · ')}
        </p>
      )}
      {bloco.proximaCategoria && (
        <p className="chat-sutil">
          {bloco.proximaCategoria.faltam === 1 ? 'Falta 1 ponto' : `Faltam ${formatNumber(bloco.proximaCategoria.faltam)} pontos`} para{' '}
          {bloco.proximaCategoria.categoria}
        </p>
      )}
      <Link to={bloco.link} className="chat-link">
        Ver extrato
      </Link>
    </div>
  )
}

const STATUS_PEDIDO = { PROCESSANDO: 'Em separação', ENVIADO: 'Enviado', ENTREGUE: 'Entregue', CANCELADO: 'Cancelado' }

function Pedidos({ bloco }) {
  return (
    <div className="chat-card">
      <p className="chat-card__titulo">Seus pedidos</p>
      <ul className="chat-lista">
        {bloco.itens.map((p) => (
          <li key={p.numero}>
            <span>
              {p.numero} <small>{formatDate(p.data)} · {formatCurrency(p.total)}</small>
              {p.rastreio && <small> · rastreio {p.rastreio}</small>}
            </span>
            <span className="chat-situacao">{STATUS_PEDIDO[p.status] ?? p.status}</span>
          </li>
        ))}
      </ul>
      <Link to={bloco.link} className="chat-link">
        Ver todos os pedidos
      </Link>
    </div>
  )
}

function AcaoSacola({ bloco, mensagemId, onConfirmar }) {
  const { item } = bloco
  const confirmado = bloco.estado === 'CONFIRMADO'
  return (
    <div className="chat-card chat-acao">
      <img src={imagemDoProduto({ ...item, id: item.produtoId }, item.cor)} alt="" className="chat-acao__foto" />
      <div className="chat-acao__info">
        <p className="chat-card__titulo">{item.nome}</p>
        <p className="chat-sutil">
          {item.cor} · {item.tamanho}
        </p>
        <p className="chat-produto__preco">{formatCurrency(item.preco)}</p>
        {confirmado ? (
          <p className="chat-ok">
            <Check size={14} aria-hidden="true" /> Na sacola
          </p>
        ) : (
          <button type="button" className="chat-botao" onClick={() => onConfirmar(mensagemId, item)}>
            <ShoppingBag size={14} aria-hidden="true" /> Adicionar à sacola
          </button>
        )}
      </div>
    </div>
  )
}

function AcaoAtendimento({ bloco, onEncaminhar }) {
  const { pathname } = useLocation()
  // enviando: null, 'SITE' ou 'WHATSAPP'
  const [estado, setEstado] = useState({ enviando: null, erro: null, protocolo: null, whatsappUrl: null })
  const abrir = async () => {
    setEstado({ enviando: 'SITE', erro: null, protocolo: null, whatsappUrl: null })
    try {
      const r = await onEncaminhar(bloco.motivo)
      setEstado({ enviando: null, erro: null, protocolo: r?.protocolo, whatsappUrl: null })
    } catch (e) {
      setEstado({ enviando: null, erro: e.message, protocolo: null, whatsappUrl: null })
    }
  }
  // O chamado nasce com o resumo da conversa e o WhatsApp abre com o protocolo já escrito. A aba é aberta
  // no próprio clique: o navegador bloqueia janela aberta depois de esperar a resposta da API.
  const whatsapp = async () => {
    const janela = window.open('', '_blank')
    setEstado({ enviando: 'WHATSAPP', erro: null, protocolo: null, whatsappUrl: null })
    try {
      const r = await onEncaminhar(bloco.motivo, 'WHATSAPP')
      if (janela) {
        janela.opener = null
        janela.location.href = r.whatsappUrl
      }
      setEstado({ enviando: null, erro: null, protocolo: r.protocolo, whatsappUrl: r.whatsappUrl })
    } catch (e) {
      janela?.close()
      setEstado({ enviando: null, erro: e.message, protocolo: null, whatsappUrl: null })
    }
  }
  return (
    <div className="chat-card">
      <p className="chat-card__titulo">Atendimento</p>
      {estado.protocolo ? (
        <>
          <p className="chat-ok">
            <Check size={14} aria-hidden="true" /> {estado.whatsappUrl ? 'Protocolo' : 'Solicitação'} {estado.protocolo} aberta
          </p>
          {estado.whatsappUrl && (
            <a href={estado.whatsappUrl} target="_blank" rel="noreferrer" className="chat-link">
              Abrir o WhatsApp de novo
            </a>
          )}
        </>
      ) : (
        <div className="chat-acoes">
          {bloco.whatsapp && (
            <button type="button" className="chat-botao chat-botao--whatsapp" onClick={whatsapp} disabled={Boolean(estado.enviando)}>
              <MessageCircle size={14} aria-hidden="true" /> {estado.enviando === 'WHATSAPP' ? 'Abrindo…' : 'Continuar no WhatsApp'}
            </button>
          )}
          {bloco.precisaLogin ? (
            <Link
              to={loginDaMarca(marcaDoCaminho(pathname))}
              state={{ from: pathname }}
              className={bloco.whatsapp ? 'chat-link' : 'chat-botao'}
            >
              Entrar para falar com a equipe
            </Link>
          ) : (
            <button type="button" className="chat-botao" onClick={abrir} disabled={Boolean(estado.enviando)}>
              <Headset size={14} aria-hidden="true" /> {estado.enviando === 'SITE' ? 'Abrindo…' : 'Falar com a equipe'}
            </button>
          )}
        </div>
      )}
      {estado.erro && <p className="chat-erro-linha">{estado.erro}</p>}
      {bloco.telefones?.length > 0 && (
        <ul className="chat-telefones">
          {bloco.telefones.map((t) => (
            <li key={t.loja}>
              {t.loja}: <a href={`tel:${t.telefone.replace(/[^\d+]/g, '')}`}>{t.telefone}</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function AtendimentoAberto({ bloco }) {
  return (
    <div className="chat-card">
      <p className="chat-ok">
        <Check size={14} aria-hidden="true" /> {bloco.whatsappUrl ? 'Protocolo' : 'Solicitação'} {bloco.protocolo}
      </p>
      {bloco.whatsappUrl && (
        <a href={bloco.whatsappUrl} target="_blank" rel="noreferrer" className="chat-botao chat-botao--whatsapp">
          <MessageCircle size={14} aria-hidden="true" /> Abrir o WhatsApp
        </a>
      )}
      {bloco.link && (
        <Link to={bloco.link} className="chat-link">
          Acompanhar a solicitação
        </Link>
      )}
    </div>
  )
}

const EQUIPE_NO_CHAT = 'Esta é uma conta da equipe. No chat, entre com uma conta de cliente.'

// Login dentro do chat, quando a pergunta precisa da conta (pontos, pedidos). Os dados vão direto para o login
// do site, nunca para a conversa; depois de entrar, a pergunta é respondida sem sair do chat.
function EntrarNoChat({ mensagemId, ultima, logado, onEntrar }) {
  const { pathname } = useLocation()
  const marca = marcaDoCaminho(pathname)
  const [dados, setDados] = useState({ email: '', senha: '' })
  const [estado, setEstado] = useState({ entrando: false, erro: null })
  if (logado) {
    return (
      <p className="chat-ok">
        <Check size={14} aria-hidden="true" /> Você entrou na sua conta
      </p>
    )
  }
  if (!ultima) return null
  const entrar = async (credenciais) => {
    setEstado({ entrando: true, erro: null })
    try {
      await onEntrar(credenciais, mensagemId)
    } catch (e) {
      const equipe = e.message?.startsWith('Esta é uma conta da equipe')
      setEstado({ entrando: false, erro: equipe ? EQUIPE_NO_CHAT : e.message || 'Não consegui entrar agora.' })
    }
  }
  const enviar = (e) => {
    e.preventDefault()
    if (dados.email.trim() && dados.senha) entrar({ email: dados.email.trim(), senha: dados.senha })
  }
  return (
    <form className="chat-card chat-entrar" onSubmit={enviar}>
      <p className="chat-card__titulo">Entrar na sua conta</p>
      <label className="chat-campo">
        <span>E-mail ou CPF</span>
        <input
          type="text"
          value={dados.email}
          onChange={(e) => setDados((d) => ({ ...d, email: e.target.value }))}
          autoComplete="username"
          required
        />
      </label>
      <label className="chat-campo">
        <span>Senha</span>
        <input
          type="password"
          value={dados.senha}
          onChange={(e) => setDados((d) => ({ ...d, senha: e.target.value }))}
          autoComplete="current-password"
          required
        />
      </label>
      {estado.erro && <p className="chat-erro-linha">{estado.erro}</p>}
      <button type="submit" className="chat-botao" disabled={estado.entrando}>
        <LogIn size={14} aria-hidden="true" /> {estado.entrando ? 'Entrando…' : 'Entrar'}
      </button>
      <p className="chat-sutil chat-entrar__links">
        <Link to={loginDaMarca(marca, '/criar-conta')} state={{ from: pathname }} className="chat-link">
          Criar conta
        </Link>
        <Link to={loginDaMarca(marca, '/esqueci-senha')} className="chat-link">
          Esqueci a senha
        </Link>
        {MODO_DEMO && (
          <button
            type="button"
            className="chat-link"
            disabled={estado.entrando}
            onClick={() => entrar({ email: CLIENTE_DEMO.email, senha: SENHA_DEMO })}
          >
            Entrar como cliente de demonstração
          </button>
        )}
      </p>
    </form>
  )
}

function Sugestoes({ itens, onEnviar, desabilitado }) {
  return (
    <div className="chat-sugestoes">
      {itens.map((texto) => (
        <button key={texto} type="button" className="chat-chip" onClick={() => onEnviar(texto)} disabled={desabilitado}>
          {texto}
        </button>
      ))}
    </div>
  )
}

export function BlocosChat({ mensagem, ultima, acoes }) {
  return mensagem.blocos.map((bloco, i) => {
    const chave = `${mensagem.id}-${i}`
    switch (bloco.tipo) {
      case 'produtos':
        return <Produtos key={chave} itens={bloco.itens} onEscolher={ultima ? acoes.escolherProduto : null} />
      case 'disponibilidade':
        return <Disponibilidade key={chave} bloco={bloco} />
      case 'lojas':
        return <Lojas key={chave} itens={bloco.itens} />
      case 'pontos':
        return <Pontos key={chave} bloco={bloco} />
      case 'pedidos':
        return <Pedidos key={chave} bloco={bloco} />
      case 'acao_sacola':
        return <AcaoSacola key={chave} bloco={bloco} mensagemId={mensagem.id} onConfirmar={acoes.confirmarSacola} />
      case 'acao_atendimento':
        return <AcaoAtendimento key={chave} bloco={bloco} onEncaminhar={acoes.encaminhar} />
      case 'atendimento_aberto':
        return <AtendimentoAberto key={chave} bloco={bloco} />
      case 'entrar':
        return <EntrarNoChat key={chave} mensagemId={mensagem.id} ultima={ultima} logado={acoes.logado} onEntrar={acoes.entrar} />
      case 'sugestoes':
        return ultima ? <Sugestoes key={chave} itens={bloco.itens} onEnviar={acoes.enviar} desabilitado={acoes.enviando} /> : null
      default:
        return null
    }
  })
}
