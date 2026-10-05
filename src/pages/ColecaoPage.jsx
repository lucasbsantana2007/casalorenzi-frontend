import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ProductGrid } from '../components/home/ProductGrid'
import { AsyncContent } from '../components/ui/AsyncContent'
import { EmptyState } from '../components/ui/EmptyState'
import { useAsync } from '../hooks/useAsync'
import { produtosService } from '../services/produtosService'
import { NotFoundPage } from './NotFoundPage'

const GENEROS = { masculino: 'Masculino', feminino: 'Feminino' }
const ESTACOES = ['Todas', 'Inverno', 'Verão']

// Peças atemporais aparecem em qualquer estação
const daEstacao = (produto, estacao) => estacao === 'Todas' || produto.estacao === estacao || produto.estacao === 'Atemporal'

export function ColecaoPage() {
  const { genero } = useParams()
  const nome = GENEROS[genero]
  const [estacao, setEstacao] = useState('Todas')
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)
  const state = useAsync(() => produtosService.listar({ ativo: true }), [])

  if (!nome) return <NotFoundPage homePath="/" />

  const produtos = (state.data ?? []).filter((p) => p.genero === nome && daEstacao(p, estacao))

  return (
    <main className="store-section store-section--page">
      <div className="store-section__head">
        <h1 className="store-heading store-heading--lg">
          {nome} <span aria-hidden="true">&gt;</span> {estacao === 'Todas' ? 'Coleção' : estacao}
        </h1>
        <button type="button" className="store-filter-btn" onClick={() => setFiltrosAbertos((v) => !v)} aria-expanded={filtrosAbertos}>
          Filtros
        </button>
      </div>

      {filtrosAbertos && (
        <div className="store-filters" role="group" aria-label="Estação">
          {ESTACOES.map((opcao) => (
            <button key={opcao} type="button" className={estacao === opcao ? 'is-active' : ''} aria-pressed={estacao === opcao} onClick={() => setEstacao(opcao)}>
              {opcao}
            </button>
          ))}
        </div>
      )}

      <AsyncContent state={{ ...state, data: state.data && produtos }} empty={<EmptyState title="Nenhuma peça nesta seleção" />}>
        {(lista) => <ProductGrid produtos={lista} colunas={3} />}
      </AsyncContent>
    </main>
  )
}
