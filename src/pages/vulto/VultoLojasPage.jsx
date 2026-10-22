import { useLojas } from '../../hooks/useCadastros'

// Lojas da Vulto: lista corrida, sem mapa (o mapa e as fotos são das lojas da Casa Lorenzi)
export function VultoLojasPage() {
  const lojas = useLojas('VULTO').filter((loja) => loja.ativa !== false)

  return (
    <main className="store-section store-section--page vulto-lojas">
      <div className="store-section__head">
        <h1 className="store-heading store-heading--lg">Lojas</h1>
      </div>
      <p className="vulto-lojas__intro">Quatro lojas físicas, o site e o app. O que você compra online sai do nosso CD em Cajamar.</p>
      <ul className="vulto-lojas__lista">
        {lojas.map((loja) => (
          <li key={loja.id}>
            <h2>{loja.nome.replace(/^Vulto\s+/, '')}</h2>
            <p className="vulto-lojas__cidade">
              {loja.cidade}
              {loja.uf && `, ${loja.uf}`}
            </p>
            {loja.endereco && <p>{loja.endereco}</p>}
            {loja.horarios?.map((linha) => (
              <p key={linha} className="vulto-lojas__horario">
                {linha}
              </p>
            ))}
            {loja.telefone && (
              <a href={`tel:${loja.telefone.replace(/[^\d+]/g, '')}`} className="vulto-lojas__telefone">
                {loja.telefone}
              </a>
            )}
          </li>
        ))}
      </ul>
    </main>
  )
}
