import { Link } from 'react-router-dom'
import { inicioDaMarca } from '../../data/marcas'
import { useMarca } from '../../hooks/useMarca'
import { LogosDoGrupo } from '../LogosDoGrupo'

const ANO = new Date().getFullYear()

// Rodapé na cor da marca da vitrine aberta (azul-marinho na Casa Lorenzi, preto na Vulto)
// marca: força a identidade (área do cliente: GRUPO, com as duas logos)
export function StoreFooter({ marca: marcaFixa }) {
  const marcaDaRota = useMarca()
  const marca = marcaFixa ?? marcaDaRota
  return (
    <footer className="store-footer">
      <div className="store-footer__top">
        <Link to={inicioDaMarca(marca)} aria-label={`${marca.nome} — início`}>
          {marca.id === 'GRUPO' ? <LogosDoGrupo claro /> : <img src={marca.logoBranca} alt={marca.nome} className="store-footer__logo" />}
        </Link>
        <nav className="store-footer__links" aria-label="Rodapé">
          {marca.nav.map((item) => (
            <Link key={item.to} to={item.to}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="store-footer__bottom">
        <span>
          © {ANO} {marca.nome} · {marca.rodape}
        </span>
      </div>
    </footer>
  )
}
