import { daysAgoInput, todayInput } from '../../utils/format'

const PRESETS = [
  { dias: 7, label: '7 dias' },
  { dias: 30, label: '30 dias' },
  { dias: 90, label: '90 dias' },
]

// Seleção de período (de/até em yyyy-mm-dd) com atalhos.
export function PeriodoFilter({ de, ate, onChange }) {
  const hoje = todayInput()
  return (
    <div className="period-filter">
      <div className="segmented" role="group" aria-label="Atalhos de período">
        {PRESETS.map(({ dias, label }) => {
          const ativo = de === daysAgoInput(dias) && ate === hoje
          return (
            <button key={dias} type="button" className={ativo ? 'is-active' : ''} aria-pressed={ativo} onClick={() => onChange({ de: daysAgoInput(dias), ate: hoje })}>
              {label}
            </button>
          )
        })}
      </div>
      <label className="period-filter__date">
        <span>De</span>
        <input className="input" type="date" value={de} max={ate || hoje} onChange={(e) => onChange({ de: e.target.value, ate })} />
      </label>
      <label className="period-filter__date">
        <span>Até</span>
        <input className="input" type="date" value={ate} min={de} max={hoje} onChange={(e) => onChange({ de, ate: e.target.value })} />
      </label>
    </div>
  )
}
