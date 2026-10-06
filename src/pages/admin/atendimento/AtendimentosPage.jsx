import { Headset } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AsyncContent } from '../../../components/ui/AsyncContent'
import { DataTable } from '../../../components/ui/DataTable'
import { EmptyState } from '../../../components/ui/EmptyState'
import { PageHeader } from '../../../components/ui/PageHeader'
import { SearchInput } from '../../../components/ui/SearchInput'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { Tabs } from '../../../components/ui/Tabs'
import { useAsync } from '../../../hooks/useAsync'
import { useEquipe } from '../../../hooks/useCadastros'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue'
import { useSession } from '../../../hooks/useSession'
import { atendimentoService } from '../../../services/atendimentoService'
import { cadastrosService } from '../../../services/cadastrosService'
import { formatDate, formatRelative } from '../../../utils/format'
import { etapaDoAtendimento, ETAPAS_ATENDIMENTO } from '../../../utils/status'

const PREFIXO_AUTOR = { CLIENTE: '', ATENDENTE: 'Equipe: ', SISTEMA: 'Sistema: ' }

const columns = [
  {
    key: 'protocolo',
    header: 'Protocolo',
    render: (a) => (
      <>
        <span className="cell-main mono">{a.protocolo}</span>
        <span className="cell-sub">{a.loja?.nome}</span>
      </>
    ),
  },
  {
    key: 'cliente',
    header: 'Cliente',
    render: (a) => (
      <div className="ticket-cell">
        <span className="cell-main">{a.cliente.nome}</span>
        {a.ultimaMensagem && (
          <span className="cell-sub ticket-cell__preview">
            {PREFIXO_AUTOR[a.ultimaMensagem.autorTipo]}
            {a.ultimaMensagem.conteudo}
          </span>
        )}
      </div>
    ),
  },
  {
    key: 'tipo',
    header: 'Tipo',
    render: (a) => (
      <>
        <span className="cell-main nowrap">{a.tipoSolicitacao.titulo}</span>
        <span className="cell-sub">{a.tipoSolicitacao.categoria}</span>
      </>
    ),
  },
  { key: 'status', header: 'Status', render: (a) => <StatusBadge type="atendimentoPainel" value={a.status} /> },
  {
    key: 'responsavel',
    header: 'Responsável',
    render: (a) => (a.responsavel ? <span className="nowrap">{a.responsavel.nome}</span> : <span className="text-warning nowrap">Sem responsável</span>),
  },
  {
    key: 'datas',
    header: 'Abertura',
    render: (a) => (
      <>
        <span className="nowrap">{formatDate(a.criadoEm)}</span>
        <span className="cell-sub nowrap">atualizado {formatRelative(a.atualizadoEm)}</span>
      </>
    ),
  },
]

export function AtendimentosPage() {
  const navigate = useNavigate()
  const { usuario } = useSession()
  const equipe = useEquipe()
  const tipos = useAsync(() => cadastrosService.listarTiposSolicitacao(), []).data ?? []
  const [aba, setAba] = useState('TODOS')
  const [busca, setBusca] = useState('')
  const [tipoId, setTipoId] = useState('')
  const [responsavelId, setResponsavelId] = useState('')
  const buscaDebounced = useDebouncedValue(busca)
  const state = useAsync(
    () => atendimentoService.listar({ busca: buscaDebounced, tipoSolicitacaoId: tipoId, responsavelId }),
    [buscaDebounced, tipoId, responsavelId],
  )

  const todos = state.data ?? []
  const pertence = (a, aba) => aba === 'TODOS' || etapaDoAtendimento(a.status) === aba
  const tabs = [{ value: 'TODOS', label: 'Todos' }, ...ETAPAS_ATENDIMENTO].map(({ value, label }) => ({
    value,
    label,
    count: todos.filter((a) => pertence(a, value)).length,
  }))

  return (
    <>
      <PageHeader eyebrow="Relacionamento" title="Atendimento" description="Solicitações de clientes de todas as lojas, com histórico completo de conversas." />

      <Tabs items={tabs} value={aba} onChange={setAba} label="Status do atendimento" />

      <div className="toolbar">
        <SearchInput value={busca} onChange={setBusca} placeholder="Protocolo, cliente ou tipo" />
        <select className="select" value={tipoId} onChange={(e) => setTipoId(e.target.value)} aria-label="Tipo de solicitação">
          <option value="">Todos os tipos</option>
          {tipos.map((t) => (
            <option key={t.id} value={t.id}>
              {t.titulo}
            </option>
          ))}
        </select>
        <select className="select" value={responsavelId} onChange={(e) => setResponsavelId(e.target.value)} aria-label="Responsável">
          <option value="">Qualquer responsável</option>
          <option value={usuario.id}>Atribuídos a mim</option>
          <option value="nenhum">Sem responsável</option>
          {equipe
            .filter((u) => u.id !== usuario.id && u.papel !== 'OPERADOR')
            .map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome}
              </option>
            ))}
        </select>
      </div>

      <AsyncContent
        state={{ ...state, data: state.data && todos.filter((a) => pertence(a, aba)) }}
        empty={<EmptyState icon={Headset} title="Nenhum atendimento encontrado" description="Não há solicitações com os filtros selecionados." />}
      >
        {(rows) => <DataTable columns={columns} rows={rows} onRowClick={(a) => navigate(`/atendimento/${a.id}`)} caption="Atendimentos" />}
      </AsyncContent>
    </>
  )
}
