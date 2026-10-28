import { Check, Copy, KeyRound } from 'lucide-react'
import { useState } from 'react'
import { API_URL } from '../../config/env'
import { useAsync } from '../../hooks/useAsync'
import { copilotoService } from '../../services/copilotoService'
import { formatDateTime, formatNumber } from '../../utils/format'
import { AsyncContent } from '../ui/AsyncContent'
import { EmptyState } from '../ui/EmptyState'
import { FormError } from '../ui/FormError'
import { StatusBadge } from '../ui/StatusBadge'

// Conectar ao Claude (decisões 106 e 114, backend: src/routers/mcp.py e docs/mcp.md): o copiloto dentro do Claude Code,
// do Claude Desktop ou do n8n, pelo servidor MCP. Cada pessoa cria os próprios tokens; o token aparece uma vez.
// No claude.ai, a conexão é pelo login do painel (OAuth), sem token.
export const URL_MCP = `${API_URL}/conector-mcp`

const SITUACAO = {
  ATIVO: { tone: 'success', label: 'Ativo' },
  VENCIDO: { tone: 'neutral', label: 'Vencido' },
  REVOGADO: { tone: 'danger', label: 'Revogado' },
}

const configuracoes = (token) => [
  {
    id: 'claude-code',
    titulo: 'Claude Code',
    dica: 'No terminal, uma vez. Depois, é só pedir no Claude Code: "quanto faturamos em setembro?".',
    texto: `claude mcp add --transport http casa-lorenzi ${URL_MCP} --header "Authorization: Bearer ${token}"`,
  },
  {
    id: 'claude-desktop',
    titulo: 'Claude Desktop',
    dica: 'Em Configurações > Desenvolvedor > Editar configuração (claude_desktop_config.json). Precisa do Node.js instalado.',
    texto: JSON.stringify(
      {
        mcpServers: {
          'casa-lorenzi': {
            command: 'npx',
            args: ['-y', 'mcp-remote', URL_MCP, '--header', 'Authorization:${AUTH}'],
            env: { AUTH: `Bearer ${token}` },
          },
        },
      },
      null,
      2,
    ),
  },
  {
    id: 'n8n',
    titulo: 'n8n',
    dica: 'No nó "MCP Client Tool" do agente: transporte HTTP Streamable e autenticação Bearer com o token.',
    texto: `Endpoint: ${URL_MCP}\nServer Transport: HTTP Streamable\nAuthentication: Bearer Auth\nToken: ${token}`,
  },
]

function Copiar({ texto, rotulo = 'Copiar' }) {
  const [copiado, setCopiado] = useState(false)
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      setCopiado(false)
    }
  }
  return (
    <button type="button" className="btn btn-secondary btn-sm" onClick={copiar}>
      {copiado ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />} {copiado ? 'Copiado' : rotulo}
    </button>
  )
}

function TokenCriado({ criado, onFechar }) {
  const opcoes = configuracoes(criado.token)
  const [aba, setAba] = useState(opcoes[0].id)
  const atual = opcoes.find((o) => o.id === aba)
  return (
    <div className="card cop-mcp__criado" role="status">
      <div className="card__header">
        <h2 className="card__title">Token "{criado.nome}" criado</h2>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onFechar}>
          Já guardei
        </button>
      </div>
      <div className="card__body stack-sm">
        <p>
          <strong>Copie agora: ele não aparece de novo.</strong> Quem tiver o token consulta o que você consulta no copiloto; não
          mande por e-mail nem cole em lugar público. Vale até {formatDateTime(criado.expiraEm)}.
        </p>
        <div className="cop-mcp__codigo">
          <code>{criado.token}</code>
          <Copiar texto={criado.token} rotulo="Copiar token" />
        </div>
        <div className="cop-mcp__abas" role="tablist" aria-label="Onde usar">
          {opcoes.map((o) => (
            <button key={o.id} type="button" role="tab" aria-selected={o.id === aba} className={o.id === aba ? 'is-active' : undefined} onClick={() => setAba(o.id)}>
              {o.titulo}
            </button>
          ))}
        </div>
        <p className="cop-sutil">{atual.dica}</p>
        <div className="cop-mcp__codigo cop-mcp__codigo--bloco">
          <pre>{atual.texto}</pre>
          <Copiar texto={atual.texto} />
        </div>
      </div>
    </div>
  )
}

function LinhaToken({ token, onRevogar, revogando }) {
  const [confirmar, setConfirmar] = useState(false)
  const situacao = SITUACAO[token.situacao] ?? SITUACAO.VENCIDO
  return (
    <tr>
      <td>
        <strong>{token.nome}</strong>
        <div className="cop-sutil">{token.prefixo === 'oauth' ? 'Conectado pelo login (claude.ai)' : <code>{token.prefixo}…</code>}</div>
      </td>
      <td>
        <StatusBadge tone={situacao.tone} label={situacao.label} />
      </td>
      <td>{formatDateTime(token.criadoEm)}</td>
      <td>{token.ultimoUsoEm ? formatDateTime(token.ultimoUsoEm) : 'Nunca usado'}</td>
      <td>{formatNumber(token.chamadas)}</td>
      <td>{token.situacao === 'REVOGADO' ? `Revogado em ${formatDateTime(token.revogadoEm)}` : formatDateTime(token.expiraEm)}</td>
      <td className="cop-mcp__acoes">
        {token.situacao === 'ATIVO' &&
          (confirmar ? (
            <>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => onRevogar(token.id)} disabled={revogando}>
                Confirmar
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmar(false)} disabled={revogando}>
                Cancelar
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setConfirmar(true)}>
              Revogar
            </button>
          ))}
      </td>
    </tr>
  )
}

// No claude.ai não há token para colar: o app pede o login do painel (OAuth, decisão 114, docs/mcp.md)
function ConectarNoClaudeAi() {
  return (
    <div className="card">
      <div className="card__header">
        <h2 className="card__title">No claude.ai, sem token</h2>
      </div>
      <div className="card__body stack-sm">
        <ol className="cop-mcp__passos">
          <li>
            No claude.ai, abra <strong>Configurações &gt; Conectores &gt; Adicionar conector personalizado</strong>.
          </li>
          <li>Dê um nome (ex.: Casa Lorenzi) e cole o endereço abaixo. Deixe client ID e segredo em branco.</li>
          <li>
            Clique em <strong>Conectar</strong>, entre com o e-mail e a senha deste painel e clique em <strong>Entrar e autorizar</strong>.
          </li>
        </ol>
        <div className="cop-mcp__codigo">
          <code>{URL_MCP}</code>
          <Copiar texto={URL_MCP} rotulo="Copiar endereço" />
        </div>
        <p className="cop-sutil">A conexão aparece na lista abaixo como &quot;Claude (login)&quot; e se revoga por aqui, como um token.</p>
      </div>
    </div>
  )
}

export function ConectarClaude() {
  const tokens = useAsync(() => copilotoService.tokensMcp(), [])
  const [nome, setNome] = useState('')
  const [criando, setCriando] = useState(false)
  const [revogando, setRevogando] = useState(false)
  const [erro, setErro] = useState(null)
  const [criado, setCriado] = useState(null)

  const criar = async (e) => {
    e.preventDefault()
    if (!nome.trim() || criando) return
    setErro(null)
    setCriando(true)
    try {
      setCriado(await copilotoService.criarTokenMcp(nome.trim()))
      setNome('')
      tokens.reload()
    } catch (falha) {
      setErro(falha)
    } finally {
      setCriando(false)
    }
  }

  const revogar = async (id) => {
    setErro(null)
    setRevogando(true)
    try {
      await copilotoService.revogarTokenMcp(id)
      tokens.reload()
    } catch (falha) {
      setErro(falha)
    } finally {
      setRevogando(false)
    }
  }

  return (
    <div className="cop-uso">
      <div className="card">
        <div className="card__header">
          <h2 className="card__title">Use o copiloto no Claude</h2>
        </div>
        <div className="card__body stack-sm">
          <p>
            Pergunte sobre vendas, estoque, transferências e Lupe+ no Claude Code, no Claude Desktop ou num agente do n8n, junto com o resto do
            seu trabalho. O servidor usa as mesmas consultas e permissões do copiloto: só leitura, só o que o seu perfil e a sua marca veem, e nenhum
            dado de cliente (pedidos, pontos ou devoluções).
          </p>
          <p className="cop-sutil">
            Endereço do servidor MCP: <code>{URL_MCP}</code>. Fora do painel, quem escreve a resposta é o Claude do app: os valores vêm prontos
            das consultas, mas confira os números importantes aqui no copiloto.
          </p>
          <form className="cop-mcp__form" onSubmit={criar}>
            <input
              className="input"
              value={nome}
              onChange={(e) => setNome(e.target.value.slice(0, 60))}
              placeholder="Onde vai usar? Ex.: Claude Code do notebook"
              aria-label="Nome do token"
            />
            <button type="submit" className="btn btn-primary" disabled={!nome.trim() || criando}>
              <KeyRound size={15} aria-hidden="true" /> {criando ? 'Criando…' : 'Criar token'}
            </button>
          </form>
          <FormError error={erro} />
        </div>
      </div>

      {criado && <TokenCriado criado={criado} onFechar={() => setCriado(null)} />}

      <ConectarNoClaudeAi />

      <div className="card">
        <div className="card__header">
          <h2 className="card__title">Seus tokens</h2>
        </div>
        <AsyncContent
          state={tokens}
          empty={
            <div className="card__body">
              <EmptyState title="Nenhum token ainda" description="Crie um token para conectar o Claude ou o n8n ao copiloto." />
            </div>
          }
        >
          {(lista) => (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Situação</th>
                    <th>Criado</th>
                    <th>Último uso</th>
                    <th>Consultas</th>
                    <th>Vale até</th>
                    <th aria-label="Ações" />
                  </tr>
                </thead>
                <tbody>
                  {lista.map((token) => (
                    <LinhaToken key={token.id} token={token} onRevogar={revogar} revogando={revogando} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AsyncContent>
      </div>
    </div>
  )
}
