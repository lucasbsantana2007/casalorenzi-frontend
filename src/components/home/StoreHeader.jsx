import { Link } from 'react-router-dom'
import { useSession } from '../../hooks/useSession'
import { BrandMark } from '../BrandMark'
import { FILTROS_VITRINE } from './filtros'

// Cabeçalho da vitrine. O login fica discreto em "Minha conta".
export function StoreHeader({ onFiltrar }) {
  const { usuario, isCliente, isEquipe } = useSession()

  return (
    <header className="store-header">
      <div className="store-container store-header__inner">
        <Link to="/" className="store-header__brand" aria-label="Casa Lorenzi — início">
          <BrandMark size="sm" />
        </Link>

        <nav className="store-header__nav" aria-label="Navegação principal">
          {FILTROS_VITRINE.map((filtro) => (
            <button key={filtro} type="button" onClick={() => onFiltrar(filtro)}>
              {filtro}
            </button>
          ))}
          <a href="#atendimento" className="store-header__highlight">
            Atendimento
          </a>
        </nav>

        <div className="store-header__account">
          {!isEquipe && (
            <Link to="/cliente/pedidos" className="store-header__link">
              Consultar pedido
            </Link>
          )}
          {isEquipe ? (
            <Link to="/dashboard" className="btn btn-secondary btn-sm">
              Painel da loja
            </Link>
          ) : (
            <Link to={isCliente ? '/cliente' : '/login'} className="btn btn-secondary btn-sm">
              {isCliente ? `Olá, ${usuario.nome.split(' ')[0]}` : 'Minha conta'}
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
