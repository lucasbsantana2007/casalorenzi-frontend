import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'

// Seleção múltipla com caixas de seleção (segmentador). Vazio = todos.
export function MultiSelect({ label, options, value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const listId = useId()

  useEffect(() => {
    if (!open) return undefined
    const fechar = (e) => {
      if (e.type === 'keydown' ? e.key === 'Escape' : !ref.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', fechar)
    document.addEventListener('keydown', fechar)
    return () => {
      document.removeEventListener('mousedown', fechar)
      document.removeEventListener('keydown', fechar)
    }
  }, [open])

  const alternar = (v) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])
  const resumo =
    value.length === 0
      ? 'Todos'
      : value.length === 1
        ? options.find((o) => o.value === value[0])?.label
        : `${value.length} selecionados`

  return (
    <div className="multi" ref={ref}>
      <span className="field__label">{label}</span>
      <button
        type="button"
        className={`select multi__trigger ${value.length ? 'multi__trigger--active' : ''}`}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{resumo}</span>
        <ChevronDown size={12} strokeWidth={2} aria-hidden="true" />
      </button>
      {open && (
        <div className="multi__menu" id={listId} role="listbox" aria-multiselectable="true" aria-label={label}>
          <div className="multi__actions">
            <button type="button" className="link" onClick={() => onChange(options.map((o) => o.value))}>
              Selecionar todos
            </button>
            <button type="button" className="link" onClick={() => onChange([])}>
              Limpar
            </button>
          </div>
          {options.map((o) => {
            const marcado = value.includes(o.value)
            return (
              <button key={o.value} type="button" role="option" aria-selected={marcado} className="multi__option" onClick={() => alternar(o.value)}>
                <span className={`multi__check ${marcado ? 'multi__check--on' : ''}`} aria-hidden="true">
                  {marcado && <Check size={12} strokeWidth={3} />}
                </span>
                {o.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
