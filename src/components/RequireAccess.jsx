import { Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import { PAPEIS } from '../utils/permissions'
import { EmptyState } from './ui/EmptyState'

// Protege uma rota por módulo. A validação definitiva deve ocorrer no backend.
export function RequireAccess({ modulo, children }) {
  const { usuario, pode } = useSession()
  if (pode(modulo)) return children
  return (
    <EmptyState
      icon={Lock}
      title="Acesso restrito"
      description={`O perfil ${PAPEIS[usuario.papel]} não tem acesso a este módulo.`}
      action={
        <Link to="/dashboard" className="btn btn-secondary btn-sm">
          Voltar ao dashboard
        </Link>
      }
    />
  )
}
