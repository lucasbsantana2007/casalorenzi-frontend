import { Link } from 'react-router-dom'
import { inicioDaMarca, LISTA_MARCAS } from '../../data/marcas'
import { useMarca } from '../../hooks/useMarca'

// Faixa preta no topo com as duas marcas do grupo: troca de uma vitrine para a outra. Só abre com o
// mouse no topo da tela e fecha quando ele sai (CSS: .barra-marcas-area:hover). O menu de cada marca
// também leva à outra.
export function BarraDeMarcas() {
  const atual = useMarca()
  return (
    <div className="barra-marcas-area">
      <nav className="barra-marcas" aria-label="Marcas do grupo">
        {LISTA_MARCAS.map((marca) => (
          <Link
            key={marca.id}
            to={inicioDaMarca(marca)}
            className={`barra-marcas__marca barra-marcas__marca--${marca.id.toLowerCase()}`}
            aria-current={marca.id === atual.id ? 'page' : undefined}
            // Solta o foco ao trocar de página: a faixa volta a ficar recolhida até o mouse subir de novo
            onClick={(e) => e.currentTarget.blur()}
          >
            <img src={marca.logoBranca} alt={marca.nome} />
          </Link>
        ))}
      </nav>
    </div>
  )
}
