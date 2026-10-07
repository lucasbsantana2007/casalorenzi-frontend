import { Link } from 'react-router-dom'
import { BrandMark } from '../BrandMark'

const ANO = new Date().getFullYear()

// Rodapé em azul-marinho, a cor da marca.
export function StoreFooter() {
  return (
    <footer className="store-footer">
      <div className="store-footer__top">
        <Link to="/" aria-label="Casa Lorenzi — início">
          <BrandMark size="sm" inverse />
        </Link>
        <nav className="store-footer__links" aria-label="Rodapé">
          <Link to="/colecao/masculino">Masculino</Link>
          <Link to="/colecao/feminino">Feminino</Link>
          <Link to="/lojas">Lojas</Link>
          <Link to="/lorenzi">Lorenzi</Link>
        </nav>
      </div>
      <div className="store-footer__bottom">
        <span>© {ANO} Casa Lorenzi · Oscar Freire · Lago Norte · Leblon · Pátio Batel · Belvedere</span>
      </div>
    </footer>
  )
}
