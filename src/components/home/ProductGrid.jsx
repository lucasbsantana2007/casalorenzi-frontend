import { Link } from 'react-router-dom'
import { imagemDoProduto } from '../../data/imagensProdutos'
import { formatCurrency } from '../../utils/format'

// Grade de produtos no estilo editorial: foto, nome em caixa alta e preço.
export function ProductGrid({ produtos, colunas = 3 }) {
  return (
    <ul className={`product-grid product-grid--${colunas}`}>
      {produtos.map((produto) => (
        <li key={produto.id}>
          <Link to={`/produto/${produto.id}`} className="product-card">
            <div className="product-card__image">
              <img src={imagemDoProduto(produto)} alt={produto.nome} loading="lazy" />
            </div>
            <h3>{produto.nome}</h3>
            <p>{formatCurrency(produto.precoBase)}</p>
          </Link>
        </li>
      ))}
    </ul>
  )
}
