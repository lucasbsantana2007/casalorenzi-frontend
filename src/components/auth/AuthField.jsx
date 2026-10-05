import { Eye, EyeOff } from 'lucide-react'
import { useId, useState } from 'react'

// Campo do formulário de login; senhas ganham o botão de mostrar/ocultar.
export function AuthField({ label, type = 'text', value, onChange, ...props }) {
  const id = useId()
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const isSenha = type === 'password'

  return (
    <div className="auth-field">
      <label htmlFor={id} className="auth-field__label">
        {label}
      </label>
      <div className="auth-field__control">
        <input id={id} type={isSenha && mostrarSenha ? 'text' : type} value={value} onChange={(e) => onChange(e.target.value)} {...props} />
        {isSenha && (
          <button
            type="button"
            className="auth-field__toggle"
            onClick={() => setMostrarSenha((v) => !v)}
            aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={mostrarSenha}
          >
            {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  )
}
