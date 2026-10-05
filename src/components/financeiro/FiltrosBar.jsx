import { RotateCcw, X } from 'lucide-react'
import { useCategorias, useLojas } from '../../hooks/useCadastros'
import {
  AGRUPAMENTOS,
  CANAIS,
  COMPARACOES,
  FILTROS_PADRAO,
  GENEROS,
  PERIODOS,
  resolverPeriodo,
} from '../../utils/filtrosFinanceiro'
import { MultiSelect } from '../ui/MultiSelect'

export function FiltrosBar({ filtros, onChange }) {
  const lojas = useLojas()
  const categorias = useCategorias()
  const set = (parcial) => onChange({ ...filtros, ...parcial })
  const opcoesLojas = lojas.map((l) => ({ value: String(l.id), label: l.nome }))
  const opcoesCategorias = categorias.map((c) => ({ value: c, label: c }))

  const escolherPeriodo = (periodo) => {
    // Ao ir para "Personalizado", começa com as datas do período que estava selecionado
    if (periodo === 'custom') set({ periodo, ...resolverPeriodo(filtros) })
    else set({ periodo, de: '', ate: '' })
  }

  // Chips dos filtros de segmentação ativos (cada um pode ser removido isoladamente)
  const chips = [
    ...filtros.lojas.map((v) => ({ grupo: 'lojas', v, label: opcoesLojas.find((o) => o.value === v)?.label ?? v })),
    ...filtros.canais.map((v) => ({ grupo: 'canais', v, label: v })),
    ...filtros.categorias.map((v) => ({ grupo: 'categorias', v, label: v })),
    ...filtros.generos.map((v) => ({ grupo: 'generos', v, label: v })),
  ]
  const alterado = JSON.stringify(filtros) !== JSON.stringify(FILTROS_PADRAO)

  return (
    <section className="card fin-filtros" aria-label="Filtros">
      <div className="fin-filtros__grid">
        <label className="fin-filtros__field">
          <span className="field__label">Período</span>
          <select className="select" value={filtros.periodo} onChange={(e) => escolherPeriodo(e.target.value)}>
            {PERIODOS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        {filtros.periodo === 'custom' && (
          <>
            <label className="fin-filtros__field">
              <span className="field__label">De</span>
              <input type="date" className="input" value={filtros.de} max={filtros.ate} onChange={(e) => set({ de: e.target.value })} />
            </label>
            <label className="fin-filtros__field">
              <span className="field__label">Até</span>
              <input type="date" className="input" value={filtros.ate} min={filtros.de} onChange={(e) => set({ ate: e.target.value })} />
            </label>
          </>
        )}

        <label className="fin-filtros__field">
          <span className="field__label">Comparar com</span>
          <select className="select" value={filtros.comparar} onChange={(e) => set({ comparar: e.target.value })}>
            {COMPARACOES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <div className="fin-filtros__field">
          <span className="field__label">Agrupar por</span>
          <div className="segmented" role="radiogroup" aria-label="Agrupar por">
            {AGRUPAMENTOS.map((a) => (
              <button
                key={a.value}
                type="button"
                role="radio"
                aria-checked={filtros.agrupar === a.value}
                className={filtros.agrupar === a.value ? 'is-active' : undefined}
                onClick={() => set({ agrupar: a.value })}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <MultiSelect label="Lojas" options={opcoesLojas} value={filtros.lojas} onChange={(lojas) => set({ lojas })} />
        <MultiSelect label="Canal" options={CANAIS} value={filtros.canais} onChange={(canais) => set({ canais })} />
        <MultiSelect label="Categoria" options={opcoesCategorias} value={filtros.categorias} onChange={(categorias) => set({ categorias })} />
        <MultiSelect label="Gênero" options={GENEROS} value={filtros.generos} onChange={(generos) => set({ generos })} />
      </div>

      {(chips.length > 0 || alterado) && (
        <div className="fin-filtros__chips">
          {chips.map((c) => (
            <button
              key={`${c.grupo}-${c.v}`}
              type="button"
              className="fin-chip"
              onClick={() => set({ [c.grupo]: filtros[c.grupo].filter((x) => x !== c.v) })}
              aria-label={`Remover filtro ${c.label}`}
            >
              {c.label}
              <X size={12} aria-hidden="true" />
            </button>
          ))}
          {alterado && (
            <button type="button" className="btn btn-ghost btn-sm fin-filtros__reset" onClick={() => onChange(FILTROS_PADRAO)}>
              <RotateCcw size={13} aria-hidden="true" /> Limpar filtros
            </button>
          )}
        </div>
      )}
    </section>
  )
}
