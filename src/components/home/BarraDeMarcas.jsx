import { Link } from 'react-router-dom'
import { inicioDaMarca, LISTA_MARCAS } from '../../data/marcas'
import { useMarca } from '../../hooks/useMarca'

// Faixa preta no topo da loja com as duas marcas do grupo: troca de uma vitrine para a outra
export function BarraDeMarcas() {
  const atual = useMarca()
  return (
    <nav className="barra-marcas" aria-label="Marcas do grupo">
      {LISTA_MARCAS.map((marca) => (
        <Link
          key={marca.id}
          to={inicioDaMarca(marca)}
          className={`barra-marcas__marca barra-marcas__marca--${marca.id.toLowerCase()}`}
          aria-current={marca.id === atual.id ? 'page' : undefined}
        >
          <img src={marca.logoBranca} alt={marca.nome} />
        </Link>
      ))}
    </nav>
  )
}
