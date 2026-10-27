import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ProductGrid } from '../../components/home/ProductGrid'
import { VideoLoop } from '../../components/ui/VideoLoop'
import { temFoto } from '../../data/imagensProdutos'
import { useAsync } from '../../hooks/useAsync'
import { useLojas } from '../../hooks/useCadastros'
import { produtosService } from '../../services/produtosService'

const DESTAQUES = 8

// Início da Vulto, no tom da Deus Ex Machina: um vídeo de oficina e estrada no topo, muito espaço,
// títulos discretos e o produto em primeiro plano. Sacola, login e checkout são os da Casa Lorenzi.
export function VultoHomePage() {
  const produtos = useAsync(() => produtosService.listar({ ativo: true, marca: 'VULTO' }), []).data ?? []
  const lojas = useLojas('VULTO').filter((loja) => loja.ativa !== false)
  // Novidades: as peças com foto primeiro, as cadastradas por último na frente
  const drop = [...produtos].sort((a, b) => Number(temFoto(b)) - Number(temFoto(a)) || b.id - a.id).slice(0, DESTAQUES)
  const categorias = [...new Set(produtos.map((p) => p.categoria))].sort((a, b) => a.localeCompare(b, 'pt-BR'))

  return (
    <main className="vulto-inicio">
      <section className="vulto-hero" aria-labelledby="vulto-hero-titulo">
        <VideoLoop nome="vulto" />
        <p className="vulto-rotulo">Inverno 26</p>
        <h1 id="vulto-hero-titulo" className="vulto-hero__titulo">
          Feito na rua, no mar e na oficina.
        </h1>
        <Link to="/vulto/loja" className="vulto-cta">
          Ver a coleção <ArrowRight size={15} strokeWidth={1.5} aria-hidden="true" />
        </Link>
      </section>

      {drop.length > 0 && (
        <section className="store-section">
          <div className="store-section__head">
            <h2 className="store-heading">Novidades</h2>
            <Link to="/vulto/loja" className="store-heading-link">
              Ver tudo
            </Link>
          </div>
          <ProductGrid produtos={drop.slice(0, 4)} colunas={4} />
        </section>
      )}

      {drop.length > 4 && (
        <>
          {/* Faixa fina e larga entre as duas linhas de peças, com o mesmo vídeo do topo */}
          <section className="vulto-faixa" aria-label="Lojas Vulto">
            <VideoLoop nome="vulto" />
            <p className="vulto-rotulo">Pinheiros · Eldorado · Savassi · Batel</p>
            <p className="vulto-faixa__texto">Nas lojas, no site e no app, com os mesmos pontos Lupe+.</p>
            <Link to="/vulto/lojas" className="vulto-link">
              Ver lojas <ArrowRight size={15} strokeWidth={1.5} aria-hidden="true" />
            </Link>
          </section>
          <section className="store-section vulto-segunda-linha" aria-label="Mais novidades">
            <ProductGrid produtos={drop.slice(4)} colunas={4} />
          </section>
        </>
      )}

      {categorias.length > 0 && (
        <section className="store-section vulto-categorias" aria-labelledby="vulto-categorias-titulo">
          <h2 id="vulto-categorias-titulo" className="vulto-rotulo">
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

      <section className="vulto-mais" aria-labelledby="vulto-mais-titulo">
        <p className="vulto-rotulo">Programa de pontos</p>
        <h2 id="vulto-mais-titulo">Lupe+</h2>
        <p>R$ 1 vira 1 ponto nas lojas e 2 no site e no app. A cada 100 pontos, R$ 5 de desconto, na Vulto e na Casa Lorenzi.</p>
        <Link to="/cliente/pontos" className="vulto-link">
          Meus pontos <ArrowRight size={15} strokeWidth={1.5} aria-hidden="true" />
        </Link>
      </section>

      {lojas.length > 0 && (
        <section className="store-section vulto-onde" aria-labelledby="vulto-onde-titulo">
          <div className="store-section__head">
            <h2 id="vulto-onde-titulo" className="vulto-rotulo">
              Onde estamos
            </h2>
            <Link to="/vulto/lojas" className="store-heading-link">
              Ver lojas
            </Link>
          </div>
          <ul className="vulto-onde__lista">
            {lojas.map((loja) => (
              <li key={loja.id}>
                {/* Abre a página Lojas já com esta loja aberta */}
                <Link to={`/vulto/lojas?loja=${loja.id}`}>
                  <strong>{loja.nome.replace(/^Vulto\s+/, '')}</strong>
                  <span>{loja.cidade}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
