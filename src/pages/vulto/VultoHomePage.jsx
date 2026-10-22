import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ProductGrid } from '../../components/home/ProductGrid'
import { VideoLoop } from '../../components/ui/VideoLoop'
import { useAsync } from '../../hooks/useAsync'
import { useLojas } from '../../hooks/useCadastros'
import { produtosService } from '../../services/produtosService'

const DESTAQUES = 8

// Início da Vulto: a marca jovem do grupo. Manchete grande, o drop mais recente, as categorias,
// o Vulto+ e as lojas. Mesma estrutura da Casa Lorenzi (sacola, login e checkout são os mesmos).
export function VultoHomePage() {
  const produtos = useAsync(() => produtosService.listar({ ativo: true, marca: 'VULTO' }), []).data ?? []
  const lojas = useLojas('VULTO').filter((loja) => loja.ativa !== false)
  // As peças cadastradas por último são as do drop mais recente
  const drop = [...produtos].sort((a, b) => b.id - a.id).slice(0, DESTAQUES)
  const categorias = [...new Set(produtos.map((p) => p.categoria))].sort((a, b) => a.localeCompare(b, 'pt-BR'))

  return (
    <main className="vulto-inicio">
      <section className="vulto-hero" aria-labelledby="vulto-hero-titulo">
        <VideoLoop nome="oficina" />
        <p className="vulto-hero__selo">Drop Inverno 26</p>
        <h1 id="vulto-hero-titulo" className="vulto-hero__titulo">
          Da rua
          <br />
          pro seu feed.
        </h1>
        <p className="vulto-hero__texto">Peças urbanas em drops curtos. Compre no site, no app ou nas lojas, com os mesmos pontos Vulto+.</p>
        <Link to="/vulto/loja" className="vulto-cta">
          Ver a loja <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </section>

      {drop.length > 0 && (
        <section className="store-section">
          <div className="store-section__head">
            <h2 className="store-heading">Acabou de chegar</h2>
            <Link to="/vulto/loja" className="store-heading-link">
              Ver tudo
            </Link>
          </div>
          <ProductGrid produtos={drop} colunas={4} />
        </section>
      )}

      {categorias.length > 0 && (
        <section className="vulto-categorias vulto-faixa-video" aria-labelledby="vulto-categorias-titulo">
          <VideoLoop nome="prancha" />
          <h2 id="vulto-categorias-titulo" className="store-heading">
            Categorias
          </h2>
          <ul>
            {categorias.map((categoria) => (
              <li key={categoria}>
                <Link to={`/vulto/loja?categoria=${encodeURIComponent(categoria)}`}>{categoria}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="vulto-mais vulto-faixa-video" aria-labelledby="vulto-mais-titulo">
        <VideoLoop nome="garagem" />
        <div>
          <h2 id="vulto-mais-titulo">Vulto+</h2>
          <p>
            R$ 1 = 1 ponto nas lojas e 2 no site e no app. A cada 100 pontos, R$ 5 de desconto. Vale nas compras da Vulto e da Casa
            Lorenzi.
          </p>
        </div>
        <Link to="/cliente/pontos" className="vulto-cta vulto-cta--claro">
          Meus pontos <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </section>

      {lojas.length > 0 && (
        <section className="store-section vulto-onde vulto-faixa-video" aria-labelledby="vulto-onde-titulo">
          <VideoLoop nome="pintura" />
          <div className="store-section__head">
            <h2 id="vulto-onde-titulo" className="store-heading">
              Onde estamos
            </h2>
            <Link to="/vulto/lojas" className="store-heading-link">
              Ver lojas
            </Link>
          </div>
          <ul className="vulto-onde__lista">
            {lojas.map((loja) => (
              <li key={loja.id}>
                <strong>{loja.nome.replace(/^Vulto\s+/, '')}</strong>
                <span>{loja.cidade}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
