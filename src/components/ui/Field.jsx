import { cloneElement, useId } from 'react'

// Envolve um único controle (input/select/textarea) com rótulo e dica, ligando os ids.
export function Field({ label, hint, children, className = '' }) {
  const id = useId()
  return (
    <div className={`field ${className}`}>
      <label htmlFor={id} className="field__label">
        {label}
      </label>
      {cloneElement(children, { id, 'aria-describedby': hint ? `${id}-hint` : undefined })}
      {hint && (
        <span id={`${id}-hint`} className="field__hint">
          {hint}
        </span>
      )}
    </div>
  )
}
