import { formatCurrency } from '../../utils/format'
import { Delta } from './Delta'
import { variacao } from './metricas'

// Clicar numa categoria filtra o painel inteiro por ela (filtro cruzado)
export function CategoriaRanking({ categorias, receitaTotal, selecionadas, onToggle }) {
  const maxReceita = Math.max(...categorias.map((c) => c.receita), 1)

  return (
    <div className="card fin-span-2">
      <div className="card__header">
        <div>
          <h2 className="card__title">Ranking de categorias</h2>
          <p className="card__subtitle">Receita no período e capital parado em estoque · clique para filtrar</p>
        </div>
      </div>
      <ol className="fin-rank">
        {categorias.map((c, i) => (
          <li key={c.categoria}>
            <button
              type="button"
              className={`fin-rank__item ${selecionadas.includes(c.categoria) ? 'fin-rank__item--on' : ''}`}
              aria-pressed={selecionadas.includes(c.categoria)}
              onClick={() => onToggle(c.categoria)}
            >
              <span className="fin-rank__pos">{i + 1}</span>
              <span className="fin-rank__body">
                <span className="fin-rank__label">
                  <span>{c.categoria}</span>
                  <strong>{formatCurrency(c.receita)}</strong>
                </span>
                <span className="bar-list__bar" aria-hidden="true">
                  <span style={{ width: `${(c.receita / maxReceita) * 100}%` }} />
                </span>
                <span className="fin-rank__meta">
                  <Delta valor={variacao(c.receita, c.receitaAnterior)} />
                  {receitaTotal ? `${Math.round((c.receita / receitaTotal) * 100)}% da receita` : '—'} · {formatCurrency(c.valorEstoque)} em estoque
                </span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}
