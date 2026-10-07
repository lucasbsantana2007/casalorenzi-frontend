import { ArrowRight, History } from 'lucide-react'
import { useState } from 'react'
import { AsyncContent } from '../../../components/ui/AsyncContent'
import { Avatar } from '../../../components/ui/Avatar'
import { EmptyState } from '../../../components/ui/EmptyState'
import { SearchInput } from '../../../components/ui/SearchInput'
import { useAsync } from '../../../hooks/useAsync'
import { useEquipe } from '../../../hooks/useCadastros'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue'
import { administracaoService } from '../../../services/administracaoService'
import { formatDateTime, formatRelative } from '../../../utils/format'
import { PAPEIS } from '../../../utils/permissions'
import { AREAS_LOG } from '../../../utils/status'

// Quem fez o quê e quando. Mais recentes primeiro.
export function LogPage() {
  const equipe = useEquipe()
  const [area, setArea] = useState('')
  const [usuarioId, setUsuarioId] = useState('')
  const [busca, setBusca] = useState('')
  const buscaDebounced = useDebouncedValue(busca)
  const state = useAsync(() => administracaoService.listarLog({ area, usuarioId, busca: buscaDebounced }), [area, usuarioId, buscaDebounced])

  return (
    <>
      <div className="toolbar">
        <SearchInput value={busca} onChange={setBusca} placeholder="Buscar no log" />
        <select className="select" value={area} onChange={(e) => setArea(e.target.value)} aria-label="Área">
          <option value="">Todas as áreas</option>
          {Object.entries(AREAS_LOG).map(([valor, rotulo]) => (
            <option key={valor} value={valor}>
              {rotulo}
            </option>
          ))}
        </select>
        <select className="select" value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)} aria-label="Quem fez">
          <option value="">Toda a equipe</option>
          {equipe.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nome}
            </option>
          ))}
        </select>
        {state.data && <span className="toolbar__summary">{state.data.length} registros</span>}
      </div>

      <AsyncContent
        state={state}
        empty={<EmptyState icon={History} title="Nenhuma ação registrada" description="As alterações feitas pela equipe aparecem aqui assim que acontecem." />}
      >
        {(registros) => (
          <ol className="log-lista">
            {registros.map((r) => (
              <li key={r.id} className="log-item">
                <Avatar name={r.usuario?.nome ?? 'Sistema'} size="sm" />
                <div className="log-item__corpo">
                  <p className="log-item__linha">
                    <strong>{r.usuario?.nome ?? 'Sistema'}</strong>
                    {r.usuario && <span className="subtle"> · {PAPEIS[r.usuario.papel]}</span>}
                    <span className="tag log-item__area">{AREAS_LOG[r.area] ?? r.area}</span>
                  </p>
                  <p className="log-item__descricao">{r.descricao}</p>
                  {r.alteracoes.length > 0 && (
                    <ul className="log-item__alteracoes">
                      {r.alteracoes.map((a) => (
                        <li key={a.campo}>
                          <span className="log-item__campo">{a.campo}:</span> <span className="log-item__de">{a.de}</span>{' '}
                          <ArrowRight size={12} aria-label="para" /> <span className="log-item__para">{a.para}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <time className="log-item__quando" dateTime={new Date(r.criadoEm).toISOString()} title={formatDateTime(r.criadoEm)}>
                  {formatRelative(r.criadoEm)}
                </time>
              </li>
            ))}
          </ol>
        )}
      </AsyncContent>
    </>
  )
}
