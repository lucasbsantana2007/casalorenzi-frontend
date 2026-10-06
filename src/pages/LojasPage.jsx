import { useState } from 'react'
import { MapaLojas } from '../components/loja/MapaLojas'
import { useLojas } from '../hooks/useCadastros'

export function LojasPage() {
  const lojas = useLojas()
  // Loja em destaque: passar o mouse na lista acende o ponto no mapa, e vice-versa
  const [ativa, setAtiva] = useState(null)

  return (
    <main className="store-section store-section--page">
      <div className="store-section__head">
        <h1 className="store-heading store-heading--lg">Lojas</h1>
      </div>
      <div className="lojas-mapa">
        <MapaLojas lojas={lojas} ativa={ativa} onAtivar={setAtiva} />
        <ul className="store-list">
          {lojas.map((loja) => (
            <li
              key={loja.id}
              className={ativa === loja.id ? 'is-ativa' : undefined}
              onMouseEnter={() => setAtiva(loja.id)}
              onMouseLeave={() => setAtiva(null)}
            >
              <strong>{loja.nome}</strong>
              <span>
                {loja.cidade}, {loja.uf}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
