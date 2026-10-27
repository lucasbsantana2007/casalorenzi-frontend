import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import feminino from '../assets/colecao/hero-feminino.webp'
import masculino from '../assets/colecao/hero-masculino.webp'
import { ProductGrid, ProductGridSkeleton } from '../components/home/ProductGrid'
import { useAsync } from '../hooks/useAsync'
import { produtosService } from '../services/produtosService'

// Peças em destaque no início, na ordem em que aparecem (ids dos produtos)
const DESTAQUES = [4, 11, 7, 6]

function selecaoDaEstacao(produtos) {
  return DESTAQUES.map((id) => produtos.find((p) => p.id === id)).filter(Boolean)
}

// Início: duas fotos grandes e uma seleção curta de peças. Nada além disso.
export function HomePage() {
  const lista = useAsync(() => produtosService.listar({ ativo: true, marca: 'LORENZI' }), [])
  const produtos = lista.data ?? []

  return (
    <main>
      <section className="split-hero" aria-label="Coleções">
        <Link to="/colecao/masculino" className="split-hero__half">
          <img src={masculino} alt="Coleção masculina Casa Lorenzi" fetchPriority="high" width="1000" height="1250" />
          <span className="split-hero__label">Comprar masculino</span>
        </Link>
        <Link to="/colecao/feminino" className="split-hero__half">
          <img src={feminino} alt="Coleção feminina Casa Lorenzi" fetchPriority="high" width="1000" height="1250" />
          <span className="split-hero__label">Comprar feminino</span>
          <ArrowRight className="split-hero__arrow" size={18} aria-hidden="true" />
        </Link>
      </section>

      {(lista.loading || produtos.length > 0) && (
        <section className="store-section">
          <div className="store-section__head">
            <h2 className="store-heading">Outono-Inverno 2026</h2>
            <Link to="/colecao/masculino" className="store-heading-link">
              Ver tudo
            </Link>
          </div>
          {lista.data === null ? (
            <ProductGridSkeleton quantidade={4} colunas={4} />
          ) : (
            <ProductGrid produtos={selecaoDaEstacao(produtos)} colunas={4} />
          )}
        </section>
      )}
    </main>
  )
}
