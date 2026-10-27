import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'
import { LoadingState } from './LoadingState'

// Centraliza loading / erro / vazio para o resultado de useAsync.
// `isEmpty` é opcional; por padrão, considera vazio um array sem itens. `carregando`: o que mostrar no lugar do
// aviso padrão enquanto carrega (ex.: a grade-esqueleto das vitrines).
export function AsyncContent({ state, children, empty, isEmpty, loadingLabel, carregando }) {
  const { data, loading, error, reload } = state
  if (loading && data === null) return carregando ?? <LoadingState label={loadingLabel} />
  if (error) return <ErrorState error={error} onRetry={reload} />
  if (data === null) return null
  const vazio = isEmpty ? isEmpty(data) : Array.isArray(data) && data.length === 0
  if (vazio) return empty ?? <EmptyState />
  return children(data)
}
