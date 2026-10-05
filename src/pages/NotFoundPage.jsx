import { Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/ui/EmptyState'

export function NotFoundPage({ homePath = '/dashboard' }) {
  return (
    <EmptyState
      icon={Compass}
      title="Página não encontrada"
      description="O endereço acessado não existe ou foi movido."
      action={
        <Link to={homePath} className="btn btn-secondary btn-sm">
          Voltar ao início
        </Link>
      }
    />
  )
}
