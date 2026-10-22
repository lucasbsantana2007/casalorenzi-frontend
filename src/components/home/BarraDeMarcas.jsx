import { Link } from 'react-router-dom'
import { inicioDaMarca, LISTA_MARCAS } from '../../data/marcas'
import { useMarca } from '../../hooks/useMarca'

// Faixa preta no topo da loja com as duas marcas do grupo: troca de uma vitrine para a outra.
// Fica recolhida e só abre quando a pessoa chega ao topo (ver useBarraNoTopo); fechada, sai da
// navegação por teclado (inert). O menu de cada marca também leva à outra.
export function BarraDeMarcas({ aberta }) {
  const atual = useMarca()
  return (
    <nav className={`barra-marcas ${aberta ? 'is-aberta' : ''}`} aria-label="Marcas do grupo" inert={!aberta}>
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
