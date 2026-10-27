import { Link } from 'react-router-dom'
import { fotoAlternativa, imagemDoProduto } from '../../data/imagensProdutos'
import { caminhoDoProduto } from '../../data/marcas'
import { formatCurrency } from '../../utils/format'

// Grade de produtos no estilo editorial: foto, nome em caixa alta e preço.
// Peça da Vulto: passar o mouse mostra a peça vestida (ou as costas). noTopo: a grade é o primeiro conteúdo da
// página (vitrine), então a primeira linha carrega logo e a primeira foto tem prioridade (é o LCP).
export function ProductGrid({ produtos, colunas = 3, noTopo = false }) {
  return (
    <ul className={`product-grid product-grid--${colunas}`}>
      {produtos.map((produto, indice) => {
        const visivel = noTopo && indice < colunas
        const frente = imagemDoProduto(produto)
        const costas = fotoAlternativa(produto)
        return (
          <li key={produto.id}>
            <Link to={caminhoDoProduto(produto)} className={`product-card ${costas ? 'product-card--duas-fotos' : ''}`}>
              <div className="product-card__image">
                <img
                  src={frente}
                  alt={produto.nome}
                  loading={visivel ? 'eager' : 'lazy'}
                  fetchPriority={noTopo && indice === 0 ? 'high' : undefined}
                />
                {costas && <img src={costas} alt="" aria-hidden="true" loading="lazy" className="product-card__costas" />}
              </div>
              <h3>{produto.nome}</h3>
              <p>{formatCurrency(produto.precoBase)}</p>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

// Enquanto a lista chega: cards cinza no mesmo formato, para a página não pular quando as peças entram
export function ProductGridSkeleton({ quantidade = 4, colunas = 3 }) {
  return (
    <ul className={`product-grid product-grid--${colunas}`} aria-busy="true" aria-label="Carregando peças">
      {Array.from({ length: quantidade }, (_, i) => (
        <li key={i}>
          <div className="product-card product-card--esqueleto" aria-hidden="true">
            <div className="product-card__image" />
            <span className="esqueleto-linha" />
            <span className="esqueleto-linha esqueleto-linha--curta" />
          </div>
        </li>
      ))}
    </ul>
  )
}
