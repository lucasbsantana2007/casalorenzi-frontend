import { useAsync } from '../../hooks/useAsync'
import { copilotoService } from '../../services/copilotoService'
import { formatNumber } from '../../utils/format'
import { AsyncContent } from '../ui/AsyncContent'
import { StatCard } from '../ui/StatCard'

// Só Administrador: uso dos assistentes e custo estimado (tokens informados pela API × tabela de preços).
const dolar = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 4 })

// "claude-haiku-5-5" vira "Claude Haiku 5.5"
const nomeDoModelo = (id = '') =>
  id
    .replace(/-(\d+)-(\d+)$/, ' $1.$2')
    .split('-')
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
    .join(' ')

const pct = (parte, total) => (total ? `${Math.round((parte / total) * 100)}%` : '—')

// O que faltou, segundo os clientes: os últimos comentários de "não ajudou" (decisão 104)
function ComentariosClientes({ lucia }) {
  if (!lucia?.comentarios.length) return null
  return (
    <div className="card">
      <div className="card__header">
        <div>
          <h2 className="card__title">O que faltou, segundo os clientes</h2>
          <p className="card__subtitle">Os últimos comentários de “não ajudou”, com a pergunta que a Lúcia respondeu</p>
        </div>
      </div>
      <div className="card__body">
        <ul className="cop-uso__comentarios">
          {lucia.comentarios.map((c) => (
            <li key={`${c.em}-${c.pergunta}`}>
              <strong>{c.comentario}</strong>
              <span className="cop-sutil">
                Pergunta: “{c.pergunta}” · {new Date(c.em).toLocaleDateString('pt-BR')}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function UsoIA() {
  const state = useAsync(() => copilotoService.uso(30), [])
  return (
    <AsyncContent state={state} isEmpty={() => false} loadingLabel="Carregando o uso da IA…">
      {(uso) => {
        const total = uso.chamadasAoModelo
        const lucia = uso.qualidade?.CLIENTE
        const avaliacoes = lucia?.avaliacoes ?? { ajudou: 0, naoAjudou: 0 }
        return (
          <div className="cop-uso">
            <div className="cop-uso__cards">
              <StatCard
                label="Modo atual"
                value={uso.modoIA === 'LLM' ? nomeDoModelo(uso.modelo) : 'Regras (sem chave)'}
                hint={uso.modoIA === 'LLM' ? 'LLM' : 'Defina ANTHROPIC_API_KEY no backend'}
              />
              <StatCard label="Chamadas ao modelo (30 dias)" value={formatNumber(total.chamadas)} hint={`${formatNumber(total.erros)} com erro · ${formatNumber(total.recusas)} recusadas`} />
              <StatCard label="Tokens (entrada / saída)" value={`${formatNumber(total.entrada)} / ${formatNumber(total.saida)}`} hint={`${formatNumber(total.cacheLeitura)} lidos do cache`} />
              <StatCard label="Custo estimado (30 dias)" value={dolar.format(total.custo)} hint={`Latência média ${formatNumber(uso.latenciaMediaMs)} ms`} />
              <StatCard
                label="Clientes: ajudou?"
                value={pct(avaliacoes.ajudou, avaliacoes.ajudou + avaliacoes.naoAjudou)}
                hint={`${formatNumber(avaliacoes.ajudou)} ajudou · ${formatNumber(avaliacoes.naoAjudou)} não ajudou`}
              />
            </div>

            <ComentariosClientes lucia={lucia} />

            <p className="cop-sutil">
              Preços de referência (US$ por milhão de tokens, entrada/saída):{' '}
              {Object.entries(uso.precosReferencia)
                .map(([modelo, [entrada, saida]]) => `${modelo} ${entrada}/${saida}`)
                .join(' · ')}
            </p>
          </div>
        )
      }}
    </AsyncContent>
  )
}
