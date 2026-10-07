import { Eye, Pencil, Plus, Shirt, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { EstoqueTabs } from '../../../components/estoque/EstoqueTabs'
import { ProdutoFormModal } from '../../../components/produtos/ProdutoFormModal'
import { EstoqueProdutoModal } from '../../../components/produtos/EstoqueProdutoModal'
import { AsyncContent } from '../../../components/ui/AsyncContent'
import { DataTable } from '../../../components/ui/DataTable'
import { EmptyState } from '../../../components/ui/EmptyState'
import { FormError } from '../../../components/ui/FormError'
import { Modal } from '../../../components/ui/Modal'
import { PageHeader } from '../../../components/ui/PageHeader'
import { SearchInput } from '../../../components/ui/SearchInput'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { useAsync } from '../../../hooks/useAsync'
import { imagemDoProduto } from '../../../data/imagensProdutos'
import { useCategorias } from '../../../hooks/useCadastros'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue'
import { produtosService } from '../../../services/produtosService'
import { formatCurrency, formatNumber } from '../../../utils/format'
import { faixaDeMargem } from '../../../utils/margem'

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
  const [removendo, setRemovendo] = useState(null)
  const [removido, setRemovido] = useState(null)

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
    {
      key: 'categoria',
      header: 'Categoria',
      render: (p) => (
        <span className="produto-categoria">
          <span className="tag">{p.categoria}</span>
          <span className="subtle">{p.genero ?? 'Sem coleção'}</span>
        </span>
      ),
    },
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
    {
      key: 'estoqueTotal',
      header: 'Estoque na rede',
      align: 'right',
      // Leva à posição atual por loja, já filtrada pelo produto
      render: (p) => (
        <Link
          to={`/estoque/posicao?busca=${encodeURIComponent(p.nome)}`}
          className="qty cell-link"
          onClick={(e) => e.stopPropagation()}
          title="Ver o estoque deste produto em cada loja"
        >
          {formatNumber(p.estoqueTotal)}
        </Link>
      ),
    },
    { key: 'ativo', header: 'Status', render: (p) => <StatusBadge type="produto" value={p.ativo} /> },
    {
      key: 'acoes',
      header: <span className="sr-only">Ações</span>,
      align: 'right',
      render: (p) => (
        <div className="row-actions" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="btn btn-ghost btn-icon" onClick={() => setVariacoesDe(p)} aria-label={`Ver variações e estoque de ${p.nome}`} title="Ver variações e estoque por loja">
            <Eye size={15} />
          </button>
          <button type="button" className="btn btn-ghost btn-icon" onClick={() => setForm({ open: true, produto: p })} aria-label={`Editar ${p.nome}`} title="Editar">
            <Pencil size={15} />
          </button>
          <button type="button" className="btn btn-ghost btn-icon btn-icon--danger" onClick={() => setRemovendo(p)} aria-label={`Remover ${p.nome}`} title="Remover">
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Operação"
        title="Estoque"
        description="Produtos e grade de variações (SKU, cor e tamanho) compartilhada por todas as lojas, com o estoque de cada peça na rede."
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setForm({ open: true, produto: null })}>
            <Plus size={16} /> Novo produto
          </button>
        }
      />

      <EstoqueTabs />

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

      {removido && (
        <p className="form-success" role="status">
          {removido} foi removido do catálogo.
        </p>
      )}

      <AsyncContent state={state} empty={<EmptyState icon={Shirt} title="Nenhum produto encontrado" description="Ajuste os filtros ou cadastre um novo produto." />}>
        {(produtos) => <DataTable columns={columns} rows={produtos} onRowClick={setVariacoesDe} caption="Produtos" />}
      </AsyncContent>

      <EstoqueProdutoModal produto={variacoesDe} onClose={() => setVariacoesDe(null)} />
      <RemoverProdutoModal
        produto={removendo}
        onClose={() => setRemovendo(null)}
        onRemovido={(nome) => {
          setRemovendo(null)
          setRemovido(nome)
          state.reload()
        }}
      />
      <ProdutoFormModal open={form.open} produto={form.produto} categorias={categorias} onClose={() => setForm({ open: false, produto: null })} onSaved={state.reload} />
    </>
  )
}

// Confirmação antes de remover: o produto sai da loja, do painel e do estoque; o histórico continua
function RemoverProdutoModal({ produto, onClose, onRemovido }) {
  return (
    <Modal open={Boolean(produto)} onClose={onClose} size="sm" title={produto ? `Remover ${produto.nome}?` : ''}>
      {produto && <ConfirmarRemocao produto={produto} onClose={onClose} onRemovido={onRemovido} />}
    </Modal>
  )
}

function ConfirmarRemocao({ produto, onClose, onRemovido }) {
  const [removendo, setRemovendo] = useState(false)
  const [erro, setErro] = useState(null)

  async function remover() {
    setErro(null)
    setRemovendo(true)
    try {
      await produtosService.remover(produto.id)
      onRemovido(produto.nome)
    } catch (err) {
      setErro(err)
      setRemovendo(false)
    }
  }

  return (
    <div className="stack">
      <p>O produto sai da loja, desta lista e do estoque. Pedidos, vendas e o histórico de movimentações continuam registrados. Não dá para desfazer.</p>
      {produto.estoqueTotal > 0 && (
        <p className="muted">
          Ainda há <strong>{formatNumber(produto.estoqueTotal)}</strong> {produto.estoqueTotal === 1 ? 'peça' : 'peças'} em estoque nas lojas. Elas deixam de aparecer no estoque.
        </p>
      )}
      <FormError error={erro} />
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={removendo}>
          Cancelar
        </button>
        <button type="button" className="btn btn-danger-solid" onClick={remover} disabled={removendo}>
          <Trash2 size={14} aria-hidden="true" /> {removendo ? 'Removendo…' : 'Remover produto'}
        </button>
      </div>
    </div>
  )
}
