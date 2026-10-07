import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'

function ResumoAssunto({ tipo, comDescricao = false }) {
  return (
    <span className="order-pick__info">
      <strong>{tipo.titulo}</strong>
      <small>
        {tipo.categoria}
        {comDescricao && ` · ${tipo.descricao}`}
      </small>
    </span>
  )
}

// Seletor do assunto da solicitação, no mesmo formato do seletor de pedido (ocupa uma linha só)
export function SeletorAssunto({ tipos, value, onChange }) {
  const [aberto, setAberto] = useState(false)
  const ref = useRef(null)
  const listaId = useId()
  const rotuloId = useId()
  const escolhido = tipos.find((t) => t.id === value)

  useEffect(() => {
    if (!aberto) return undefined
    const fechar = (e) => {
      if (e.type === 'keydown' ? e.key === 'Escape' : !ref.current?.contains(e.target)) setAberto(false)
    }
    document.addEventListener('mousedown', fechar)
    document.addEventListener('keydown', fechar)
    return () => {
      document.removeEventListener('mousedown', fechar)
      document.removeEventListener('keydown', fechar)
    }
  }, [aberto])

  return (
    <div className="order-pick" ref={ref}>
      <span className="order-pick__label" id={rotuloId}>
        Assunto
      </span>
      <button
        type="button"
        className={`order-pick__trigger ${aberto ? 'is-open' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-controls={listaId}
        aria-labelledby={rotuloId}
        onClick={() => setAberto((v) => !v)}
      >
        {escolhido ? <ResumoAssunto tipo={escolhido} /> : <span className="order-pick__placeholder">Selecione o assunto</span>}
        <ChevronDown size={16} className="order-pick__arrow" aria-hidden="true" />
      </button>

      {aberto && (
        <ul className="order-pick__menu" id={listaId} role="listbox" aria-labelledby={rotuloId}>
          {tipos.map((t) => {
            const marcado = t.id === value
            return (
              <li key={t.id} role="option" aria-selected={marcado}>
                <button
                  type="button"
                  className={`order-pick__option ${marcado ? 'is-selected' : ''}`}
                  onClick={() => {
                    onChange(t.id)
                    setAberto(false)
                  }}
                >
                  <ResumoAssunto tipo={t} comDescricao />
                  <span className="order-pick__check" aria-hidden="true">
                    {marcado && <Check size={14} strokeWidth={2.5} />}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
