import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import feminino from '../assets/colecao/hero-feminino.jpg'
import masculino from '../assets/colecao/hero-masculino.jpg'
import { ProductGrid } from '../components/home/ProductGrid'
import { useAsync } from '../hooks/useAsync'
import { produtosService } from '../services/produtosService'

// Intercala masculino e feminino para a seleção da estação
function selecaoDaEstacao(produtos) {
  const inverno = produtos.filter((p) => p.estacao === 'Inverno')
  const masc = inverno.filter((p) => p.genero === 'Masculino')
  const fem = inverno.filter((p) => p.genero === 'Feminino')
  return [masc[0], fem[0], masc[1], fem[1]].filter(Boolean)
}

// Início: duas fotos grandes e uma seleção curta de peças. Nada além disso.
export function HomePage() {
  const produtos = useAsync(() => produtosService.listar({ ativo: true }), []).data ?? []

  return (
    <main>
      <section className="split-hero" aria-label="Coleções">
        <Link to="/colecao/masculino" className="split-hero__half">
          <img src={masculino} alt="Coleção masculina Casa Lorenzi" />
          <span className="split-hero__label">Comprar masculino</span>
        </Link>
        <Link to="/colecao/feminino" className="split-hero__half">
          <img src={feminino} alt="Coleção feminina Casa Lorenzi" />
          <span className="split-hero__label">Comprar feminino</span>
          <ArrowRight className="split-hero__arrow" size={18} aria-hidden="true" />
        </Link>
      </section>

      {produtos.length > 0 && (
        <section className="store-section">
          <div className="store-section__head">
            <h2 className="store-heading">Outono-Inverno 2026</h2>
            <Link to="/colecao/masculino" className="store-heading-link">
              Ver tudo
            </Link>
          </div>
          <ProductGrid produtos={selecaoDaEstacao(produtos)} colunas={4} />
        </section>
      )}
    </main>
  )
}
