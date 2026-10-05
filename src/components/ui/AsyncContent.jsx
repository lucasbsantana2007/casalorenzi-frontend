import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'
import { LoadingState } from './LoadingState'

// Centraliza loading / erro / vazio para o resultado de useAsync.
// `isEmpty` é opcional; por padrão, considera vazio um array sem itens.
export function AsyncContent({ state, children, empty, isEmpty, loadingLabel }) {
  const { data, loading, error, reload } = state
  if (loading && data === null) return <LoadingState label={loadingLabel} />
  if (error) return <ErrorState error={error} onRetry={reload} />
  if (data === null) return null
  const vazio = isEmpty ? isEmpty(data) : Array.isArray(data) && data.length === 0
  if (vazio) return empty ?? <EmptyState />
  return children(data)
}
