import { CircleAlert } from 'lucide-react'

export function ErrorState({ error, onRetry }) {
  return (
    <div className="state state--error" role="alert">
      <CircleAlert size={28} strokeWidth={1.4} aria-hidden="true" />
      <strong>Não foi possível carregar os dados</strong>
      <p>{error?.message ?? 'Erro inesperado.'}</p>
      {onRetry && (
        <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
          Tentar novamente
        </button>
      )}
    </div>
  )
}
