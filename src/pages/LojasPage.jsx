import { useLojas } from '../hooks/useCadastros'

export function LojasPage() {
  const lojas = useLojas()

  return (
    <main className="store-section store-section--page">
      <div className="store-section__head">
        <h1 className="store-heading store-heading--lg">Lojas</h1>
      </div>
      <ul className="store-list">
        {lojas.map((loja) => (
          <li key={loja.id}>
            <strong>{loja.nome}</strong>
            <span>
              {loja.cidade}, {loja.uf}
            </span>
          </li>
        ))}
      </ul>
    </main>
  )
}
