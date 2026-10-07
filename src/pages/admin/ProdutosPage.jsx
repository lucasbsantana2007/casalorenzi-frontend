import { Eye, Pencil, Plus, Shirt } from 'lucide-react'
import { useState } from 'react'
import { ProdutoFormModal } from '../../components/produtos/ProdutoFormModal'
import { VariacoesModal } from '../../components/produtos/VariacoesModal'
import { AsyncContent } from '../../components/ui/AsyncContent'
import { DataTable } from '../../components/ui/DataTable'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'
import { SearchInput } from '../../components/ui/SearchInput'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useAsync } from '../../hooks/useAsync'
import { imagemDoProduto } from '../../data/imagensProdutos'
import { useCategorias } from '../../hooks/useCadastros'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { produtosService } from '../../services/produtosService'
import { formatCurrency, formatNumber } from '../../utils/format'
import { faixaDeMargem } from '../../utils/margem'

const resumoGrade = (variacoes) => {
  const cores = [...new Set(variacoes.map((v) => v.cor))]
  const tamanhos = [...new Set(variacoes.map((v) => v.tamanho))]
  return `${cores.join(', ')} · ${tamanhos.join(' / ')}`
}

export function ProdutosPage() {
  const categorias = useCategorias()
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState('')
  const [ativo, setAtivo] = useState('true')
  const buscaDebounced = useDebouncedValue(busca)
  const state = useAsync(() => produtosService.listar({ busca: buscaDebounced, categoria, ativo }), [buscaDebounced, categoria, ativo])
  const [variacoesDe, setVariacoesDe] = useState(null)
  const [form, setForm] = useState({ open: false, produto: null })

  const columns = [
    {
      key: 'nome',
      header: 'Produto',
      render: (p) => (
        <span className="produto-celula">
          <img src={imagemDoProduto(p)} alt="" loading="lazy" />
          <span className="cell-main">{p.nome}</span>
        </span>
      ),
    },
    { key: 'categoria', header: 'Categoria', render: (p) => <span className="tag">{p.categoria}</span> },
    { key: 'precoBase', header: 'Preço de venda', align: 'right', render: (p) => <span className="nowrap">{formatCurrency(p.precoBase)}</span> },
    { key: 'margem', header: 'Margem', align: 'right', render: (p) => <span className="nowrap">{faixaDeMargem(p.precoBase, p.variacoes) ?? '—'}</span> },
    {
      key: 'variacoes',
      header: 'Variações',
      render: (p) => (
        <>
          <span className="cell-main">{p.variacoes.length} SKUs</span>
          <span className="cell-sub">{resumoGrade(p.variacoes)}</span>
        </>
      ),
    },
    { key: 'estoqueTotal', header: 'Estoque na rede', align: 'right', render: (p) => <span className="qty">{formatNumber(p.estoqueTotal)}</span> },
    { key: 'ativo', header: 'Status', render: (p) => <StatusBadge type="produto" value={p.ativo} /> },
    {
      key: 'acoes',
      header: <span className="sr-only">Ações</span>,
      align: 'right',
      render: (p) => (
        <div className="row-actions" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="btn btn-ghost btn-icon" onClick={() => setVariacoesDe(p)} aria-label={`Ver variações de ${p.nome}`} title="Ver variações">
            <Eye size={15} />
          </button>
          <button type="button" className="btn btn-ghost btn-icon" onClick={() => setForm({ open: true, produto: p })} aria-label={`Editar ${p.nome}`} title="Editar">
            <Pencil size={15} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Catálogo"
        title="Produtos"
        description="Cadastro de produtos e da grade de variações (SKU, cor e tamanho) compartilhada por todas as lojas."
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setForm({ open: true, produto: null })}>
            <Plus size={16} /> Novo produto
          </button>
        }
      />

      <div className="toolbar">
        <SearchInput value={busca} onChange={setBusca} placeholder="Buscar por nome, categoria ou SKU" />
        <select className="select" value={categoria} onChange={(e) => setCategoria(e.target.value)} aria-label="Categoria">
          <option value="">Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select className="select" value={ativo} onChange={(e) => setAtivo(e.target.value)} aria-label="Status">
          <option value="true">Ativos</option>
          <option value="false">Inativos</option>
          <option value="">Todos</option>
        </select>
        {state.data && <span className="toolbar__summary">{state.data.length} produtos</span>}
      </div>

      <AsyncContent state={state} empty={<EmptyState icon={Shirt} title="Nenhum produto encontrado" description="Ajuste os filtros ou cadastre um novo produto." />}>
        {(produtos) => <DataTable columns={columns} rows={produtos} onRowClick={setVariacoesDe} caption="Produtos" />}
      </AsyncContent>

      <VariacoesModal produto={variacoesDe} onClose={() => setVariacoesDe(null)} />
      <ProdutoFormModal open={form.open} produto={form.produto} categorias={categorias} onClose={() => setForm({ open: false, produto: null })} onSaved={state.reload} />
    </>
  )
}
