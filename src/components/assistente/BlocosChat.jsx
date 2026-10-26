import { Check, Clock, Headset, MapPin, Phone, ShoppingBag } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { imagemDoProduto } from '../../data/imagensProdutos'
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
      <p className="chat-card__titulo">Vulto+</p>
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
  const [estado, setEstado] = useState({ enviando: false, erro: null, protocolo: null })
  const abrir = async () => {
    setEstado({ enviando: true, erro: null, protocolo: null })
    try {
      const r = await onEncaminhar(bloco.motivo)
      setEstado({ enviando: false, erro: null, protocolo: r?.protocolo })
    } catch (e) {
      setEstado({ enviando: false, erro: e.message, protocolo: null })
    }
  }
  return (
    <div className="chat-card">
      <p className="chat-card__titulo">Atendimento</p>
      {bloco.precisaLogin ? (
        <Link to="/login" state={{ from: pathname }} className="chat-botao">
          Entrar para falar com a equipe
        </Link>
      ) : estado.protocolo ? (
        <p className="chat-ok">
          <Check size={14} aria-hidden="true" /> Solicitação {estado.protocolo} aberta
        </p>
      ) : (
        <button type="button" className="chat-botao" onClick={abrir} disabled={estado.enviando}>
          <Headset size={14} aria-hidden="true" /> {estado.enviando ? 'Abrindo…' : 'Falar com a equipe'}
        </button>
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
        <Check size={14} aria-hidden="true" /> Solicitação {bloco.protocolo}
      </p>
      <Link to={bloco.link} className="chat-link">
        Acompanhar a solicitação
      </Link>
    </div>
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
      case 'sugestoes':
        return ultima ? <Sugestoes key={chave} itens={bloco.itens} onEnviar={acoes.enviar} desabilitado={acoes.enviando} /> : null
      default:
        return null
    }
  })
}
