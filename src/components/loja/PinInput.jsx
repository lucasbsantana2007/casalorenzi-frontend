import { useId } from 'react'

const TAMANHO = 4

// PIN de 4 dígitos mostrado como 4 círculos que se preenchem.
// Um input numérico transparente fica por cima: teclado numérico no celular, colar e apagar funcionam normalmente.
export function PinInput({ label, value, onChange, invalid = false, onPaste, autoFocus = false, autoComplete = 'off' }) {
  const id = useId()
  return (
    <div className="pin">
      <label htmlFor={id} className="pin__label">
        {label}
      </label>
      <div className={`pin__box ${invalid ? 'is-invalid' : ''}`}>
        <input
          id={id}
          className="pin__input"
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={autoComplete}
          maxLength={TAMANHO}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, TAMANHO))}
          onPaste={onPaste}
          autoFocus={autoFocus}
          aria-invalid={invalid}
          required
        />
        {Array.from({ length: TAMANHO }, (_, i) => (
          <span
            key={i}
            className={`pin__dot ${i < value.length ? 'is-filled' : ''} ${i === Math.min(value.length, TAMANHO - 1) ? 'is-next' : ''}`}
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  )
}
