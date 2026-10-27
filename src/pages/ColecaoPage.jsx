import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ProductGrid, ProductGridSkeleton } from '../components/home/ProductGrid'
import { FiltrosColecao } from '../components/loja/FiltrosColecao'
import { AsyncContent } from '../components/ui/AsyncContent'
import { EmptyState } from '../components/ui/EmptyState'
import { ordenarVitrine } from '../data/imagensProdutos'
import { useAsync } from '../hooks/useAsync'
import { produtosService } from '../services/produtosService'
import { NotFoundPage } from './NotFoundPage'

const GENEROS = { masculino: 'Masculino', feminino: 'Feminino' }
const SEM_FILTROS = { categoria: null, tamanhos: [], faixa: null }

// disponivel desconta as peças reservadas por pedidos ainda não enviados (mocks: só estoqueTotal)
const livre = (v) => v.disponivel ?? v.estoqueTotal

// A peça entra se tiver algum dos tamanhos escolhidos disponível
function filtrar(produtos, { categoria, tamanhos, faixa }) {
  return produtos.filter(
    (p) =>
      (!categoria || p.categoria === categoria) &&
      (tamanhos.length === 0 || p.variacoes.some((v) => tamanhos.includes(v.tamanho) && livre(v) > 0)) &&
      (!faixa || (p.precoBase >= faixa[0] && p.precoBase <= faixa[1])),
  )
}

export function ColecaoPage() {
  const { genero } = useParams()
  const nome = GENEROS[genero]
  const state = useAsync(() => produtosService.listar({ ativo: true, marca: 'LORENZI' }), [])

  if (!nome) return <NotFoundPage homePath="/" />

  const selecao = state.data && state.data.filter((p) => p.genero === nome)
  // key: os filtros recomeçam ao trocar de Masculino para Feminino
  return <Colecao key={genero} nome={nome} state={{ ...state, data: selecao }} />
}

// Grade com filtros (categoria, tamanho, faixa de preço). state.data: as peças da seleção (gênero na
// Casa Lorenzi; a loja inteira na Vulto). Também usada pela vitrine da Vulto.
export function Colecao({ nome, state, categoria = null }) {
  // categoria: já abre filtrada (links de categoria do início da Vulto)
  const [filtros, setFiltros] = useState({ ...SEM_FILTROS, categoria })

  const selecao = state.data ?? []
  const produtos = ordenarVitrine(filtrar(selecao, filtros))
  const filtrando = Boolean(filtros.categoria || filtros.tamanhos.length || filtros.faixa)
  const limpar = () => setFiltros(SEM_FILTROS)

  return (
    <main className="store-section store-section--page">
      <div className="store-section__head">
        <h1 className="store-heading store-heading--lg">
          {nome} <span aria-hidden="true">&gt;</span> {filtros.categoria ?? 'Coleção'}
        </h1>
        <FiltrosColecao produtos={selecao} filtros={filtros} onChange={setFiltros} onLimpar={limpar} total={produtos.length} />
      </div>

      <AsyncContent
        state={{ ...state, data: state.data && produtos }}
        carregando={<ProductGridSkeleton quantidade={6} colunas={3} />}
        empty={
          <EmptyState
            title="Nenhuma peça nesta seleção"
            action={
              filtrando && (
                <button type="button" className="store-filter-btn" onClick={limpar}>
                  Limpar filtros
                </button>
              )
            }
          />
        }
      >
        {(lista) => <ProductGrid produtos={lista} colunas={3} />}
      </AsyncContent>
    </main>
  )
}
