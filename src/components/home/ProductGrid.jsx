import { Link } from 'react-router-dom'
import { fotosDoProduto } from '../../data/imagensProdutos'
import { caminhoDoProduto } from '../../data/marcas'
import { formatCurrency } from '../../utils/format'

// Grade de produtos no estilo editorial: foto, nome em caixa alta e preço.
// Peça com foto de costas (Vulto): passar o mouse troca para ela.
export function ProductGrid({ produtos, colunas = 3 }) {
  return (
    <ul className={`product-grid product-grid--${colunas}`}>
      {produtos.map((produto) => {
        const [frente, costas] = fotosDoProduto(produto)
        return (
          <li key={produto.id}>
            <Link to={caminhoDoProduto(produto)} className={`product-card ${costas ? 'product-card--duas-fotos' : ''}`}>
              <div className="product-card__image">
                <img src={frente} alt={produto.nome} loading="lazy" />
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
