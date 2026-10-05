import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SolicitacaoCard } from '../../components/atendimento/SolicitacaoCard'
import { AsyncContent } from '../../components/ui/AsyncContent'
import { EmptyState } from '../../components/ui/EmptyState'
import { Tabs } from '../../components/ui/Tabs'
import { useAsync } from '../../hooks/useAsync'
import { useSession } from '../../hooks/useSession'
import { clienteService } from '../../services/clienteService'
import { ATENDIMENTO_ABERTO } from '../../utils/status'

export function MinhasSolicitacoesPage() {
  const { clienteId } = useSession()
  const state = useAsync(() => clienteService.listarSolicitacoes(clienteId), [clienteId])
  const [aba, setAba] = useState('ABERTAS')
  const todas = state.data ?? []
  const abertas = todas.filter((s) => ATENDIMENTO_ABERTO.includes(s.status))
  const visiveis = aba === 'ABERTAS' ? abertas : todas.filter((s) => !ATENDIMENTO_ABERTO.includes(s.status))

  return (
    <>
      <div className="client-page-header">
        <div>
          <p className="eyebrow">Atendimento</p>
          <h1 className="client-title">Minhas solicitações</h1>
        </div>
        <Link to="/cliente/solicitacoes/nova" className="btn btn-primary">
          <Plus size={16} /> Nova solicitação
        </Link>
      </div>

      <Tabs
        items={[
          { value: 'ABERTAS', label: 'Em andamento', count: abertas.length },
          { value: 'CONCLUIDAS', label: 'Concluídas', count: todas.length - abertas.length },
        ]}
        value={aba}
        onChange={setAba}
        label="Situação das solicitações"
      />

      <AsyncContent
        state={{ ...state, data: state.data && visiveis }}
        empty={
          <EmptyState
            title={aba === 'ABERTAS' ? 'Nenhuma solicitação em andamento' : 'Nenhuma solicitação concluída'}
            action={
              <Link to="/cliente/solicitacoes/nova" className="btn btn-secondary btn-sm">
                Abrir solicitação
              </Link>
            }
          />
        }
      >
        {(lista) => (
          <div className="request-list">
            {lista.map((s) => (
              <SolicitacaoCard key={s.id} solicitacao={s} />
            ))}
          </div>
        )}
      </AsyncContent>
    </>
  )
}
