import { useState } from 'react'
import { EstoqueTabs } from '../../../components/estoque/EstoqueTabs'
import { MovimentacoesTable } from '../../../components/estoque/MovimentacoesTable'
import { PeriodoFilter } from '../../../components/estoque/PeriodoFilter'
import { AsyncContent } from '../../../components/ui/AsyncContent'
import { EmptyState } from '../../../components/ui/EmptyState'
import { PageHeader } from '../../../components/ui/PageHeader'
import { SearchInput } from '../../../components/ui/SearchInput'
import { useAsync } from '../../../hooks/useAsync'
import { useLojas } from '../../../hooks/useCadastros'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue'
import { estoqueService } from '../../../services/estoqueService'
import { TIPOS_MOVIMENTACAO } from '../../../utils/estoque'
import { daysAgoInput, formatNumber, todayInput } from '../../../utils/format'

export function MovimentacoesPage() {
  const lojas = useLojas()
  const [periodo, setPeriodo] = useState(() => ({ de: daysAgoInput(7), ate: todayInput() }))
  const [lojaId, setLojaId] = useState('')
  const [tipo, setTipo] = useState('')
  const [busca, setBusca] = useState('')
  const buscaDebounced = useDebouncedValue(busca)
  const state = useAsync(
    () => estoqueService.listarMovimentacoes({ ...periodo, lojaId, tipo, busca: buscaDebounced }),
    [periodo.de, periodo.ate, lojaId, tipo, buscaDebounced],
  )
  const movs = state.data ?? []

  return (
    <>
      <PageHeader eyebrow="Operação" title="Estoque" description="Registro completo de entradas, vendas, ajustes e transferências, filtrável por período." />
      <EstoqueTabs />

      <div className="stack-sm">
        <div className="toolbar">
          <PeriodoFilter de={periodo.de} ate={periodo.ate} onChange={setPeriodo} />
        </div>
        <div className="toolbar">
          <SearchInput value={busca} onChange={setBusca} placeholder="Produto, SKU ou referência" />
          <select className="select" value={lojaId} onChange={(e) => setLojaId(e.target.value)} aria-label="Loja">
            <option value="">Todas as lojas</option>
            {lojas.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nome}
              </option>
            ))}
          </select>
          <select className="select" value={tipo} onChange={(e) => setTipo(e.target.value)} aria-label="Tipo">
            <option value="">Todos os tipos</option>
            {Object.entries(TIPOS_MOVIMENTACAO).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {state.data && (
            <span className="toolbar__summary">
              {movs.length} registros · entradas {formatNumber(movs.filter((m) => m.quantidade > 0).reduce((s, m) => s + m.quantidade, 0))} · saídas{' '}
              {formatNumber(Math.abs(movs.filter((m) => m.quantidade < 0).reduce((s, m) => s + m.quantidade, 0)))}
            </span>
          )}
        </div>
      </div>

      <AsyncContent state={state} empty={<EmptyState title="Nenhuma movimentação no período" description="Altere o intervalo de datas ou os filtros." />}>
        {(rows) => <MovimentacoesTable rows={rows} pageSize={25} />}
      </AsyncContent>
    </>
  )
}
