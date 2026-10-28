import { Coins, Sparkles, Users } from 'lucide-react'
import { useState } from 'react'
import { AsyncContent } from '../../../components/ui/AsyncContent'
import { DataTable } from '../../../components/ui/DataTable'
import { EmptyState } from '../../../components/ui/EmptyState'
import { PageHeader } from '../../../components/ui/PageHeader'
import { SearchInput } from '../../../components/ui/SearchInput'
import { Select } from '../../../components/ui/Select'
import { StatCard } from '../../../components/ui/StatCard'
import { NavTabs } from '../../../components/ui/Tabs'
import { useAsync } from '../../../hooks/useAsync'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue'
import { atendimentoService } from '../../../services/atendimentoService'
import { formatCurrency, formatDate, formatNumber } from '../../../utils/format'

// Seções do Atendimento: as solicitações e o Lupe+ dos clientes
export const SECOES_ATENDIMENTO = [
  { to: '/atendimento', label: 'Solicitações', end: true },
  { to: '/atendimento/lupe', label: 'Lupe+' },
]

const CATEGORIAS = [
  { value: 'BRONZE', label: 'Bronze' },
  { value: 'PRATA', label: 'Prata' },
  { value: 'OURO', label: 'Ouro' },
  { value: 'VIP', label: 'VIP' },
]
const ROTULO_CATEGORIA = Object.fromEntries(CATEGORIAS.map((c) => [c.value, c.label]))

const columns = [
  {
    key: 'cliente',
    header: 'Cliente',
    render: (c) => (
      <>
        <span className="cell-main">{c.nome}</span>
        <span className="cell-sub">{c.email ?? 'Sem e-mail'}</span>
      </>
    ),
  },
  {
    key: 'categoria',
    header: 'Categoria',
    render: (c) => <span className={`badge badge--lupe badge--lupe-${(c.categoria ?? 'nenhuma').toLowerCase()}`}>{ROTULO_CATEGORIA[c.categoria] ?? 'Sem categoria'}</span>,
  },
  { key: 'saldo', header: 'Pontos', align: 'right', render: (c) => <span className="nowrap tabular">{formatNumber(c.saldo)}</span> },
  { key: 'valor', header: 'Em desconto', align: 'right', render: (c) => <span className="nowrap tabular">{formatCurrency(c.valorEmReais)}</span> },
  {
    key: 'vencimento',
    header: 'Próximo vencimento',
    render: (c) =>
      c.proximoVencimento ? (
        <>
          <span className="nowrap">{formatDate(`${c.proximoVencimento.data}T12:00:00`)}</span>
          <span className="cell-sub nowrap">{formatNumber(c.proximoVencimento.pontos)} pontos</span>
        </>
      ) : (
        '—'
      ),
  },
]

// Atendimento > Lupe+ (decisão 120): quantos pontos cada cliente tem, para responder o cliente sem trocar de tela.
// O saldo é o da ficha do cliente: só os pontos válidos (os vencidos ficam de fora).
export function LupeClientesPage() {
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState('')
  const [ordem, setOrdem] = useState('saldo')
  const buscaDebounced = useDebouncedValue(busca)
  const state = useAsync(
    () => atendimentoService.pontosDosClientes({ busca: buscaDebounced, categoria, ordem }),
    [buscaDebounced, categoria, ordem],
  )
  const dados = state.data

  return (
    <>
      <PageHeader eyebrow="Relacionamento" title="Atendimento" description="Quantos pontos Lupe+ cada cliente tem, a categoria e o que vence primeiro." />
      <NavTabs items={SECOES_ATENDIMENTO} label="Seções do atendimento" />

      <section className="kpi-grid lupe-resumo" aria-label="Resumo do Lupe+">
        <StatCard label="Clientes com pontos" value={dados ? formatNumber(dados.clientes) : '—'} icon={Users} hint="Com os filtros abaixo" />
        <StatCard label="Pontos válidos" value={dados ? formatNumber(dados.pontos) : '—'} icon={Sparkles} />
        <StatCard label="Em desconto" value={dados ? formatCurrency(dados.valorEmReais) : '—'} icon={Coins} hint="100 pontos = R$ 5,00" />
      </section>

      <div className="toolbar">
        <SearchInput value={busca} onChange={setBusca} placeholder="Nome, e-mail ou CPF" label="Buscar cliente" />
        <Select className="select" value={categoria} onChange={(e) => setCategoria(e.target.value)} aria-label="Categoria">
          <option value="">Todas as categorias</option>
          {CATEGORIAS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
        <Select className="select" value={ordem} onChange={(e) => setOrdem(e.target.value)} aria-label="Ordenar por">
          <option value="saldo">Mais pontos primeiro</option>
          <option value="vencimento">Vence primeiro</option>
          <option value="nome">Nome</option>
        </Select>
      </div>

      <AsyncContent
        state={{ ...state, data: dados ? dados.itens : null }}
        empty={<EmptyState icon={Sparkles} title="Nenhum cliente encontrado" description="Não há clientes com pontos válidos com esses filtros." />}
      >
        {(rows) => <DataTable columns={columns} rows={rows} caption="Clientes e pontos Lupe+" />}
      </AsyncContent>
    </>
  )
}
