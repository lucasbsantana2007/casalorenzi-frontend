import { formatCurrency, formatDate } from '../../utils/format'
import { formatarPontos, proximaCategoria } from '../../utils/fidelidade'

const LIMITES = { Bronze: [1, 1500], Prata: [1501, 5000], Ouro: [5001, 9999] }

// Resumo do Helo: categoria, saldo, valor em reais, progresso até a próxima categoria e próximos vencimentos.
// `pontos` é a resposta de GET /conta/pontos ou /clientes/{cpf}/pontos. compacto: sem vencimentos (cards do painel)
export function CartaoVultoMais({ pontos, compacto = false }) {
  const proxima = proximaCategoria(pontos.saldo)
  const faixa = LIMITES[pontos.categoria]
  const progresso = faixa ? Math.min(100, Math.round(((pontos.saldo - faixa[0] + 1) / (faixa[1] - faixa[0] + 1)) * 100)) : pontos.categoria ? 100 : 0

  return (
    <div className={`vulto-card ${pontos.categoria ? `vulto-card--${pontos.categoria.toLowerCase()}` : ''}`}>
      <div className="vulto-card__topo">
        <span className="vulto-card__marca">Helo</span>
        <span className="vulto-card__categoria">{pontos.categoria ?? 'Sem categoria'}</span>
      </div>
      <div className="vulto-card__saldo">
        <strong>{pontos.saldo.toLocaleString('pt-BR')}</strong>
        <span>pontos · valem {formatCurrency(pontos.valorEmReais)}</span>
      </div>
      {pontos.bonus > 0 && <p className="vulto-card__bonus">Bônus {pontos.categoria}: +{pontos.bonus}% de pontos em cada compra</p>}
      <div className="vulto-card__progresso" aria-hidden="true">
        <span style={{ width: `${progresso}%` }} />
      </div>
      <p className="vulto-card__proxima">
        {proxima ? `Faltam ${formatarPontos(proxima.faltam)} para ${proxima.categoria}` : 'Você está na categoria mais alta'}
      </p>
      {!compacto && pontos.aVencer.length > 0 && (
        <ul className="vulto-card__vencimentos">
          {pontos.aVencer.map((v) => (
            <li key={v.data}>
              {formatarPontos(v.pontos)} vencem em {formatDate(`${v.data}T12:00:00`)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
