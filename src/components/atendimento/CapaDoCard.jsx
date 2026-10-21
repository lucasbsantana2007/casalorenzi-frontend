// Capa dos cards da área do cliente: até duas fotos lado a lado e "+N" quando há mais; sem foto, o ícone.
// As fotos são decorativas (o card já diz o nome das peças), por isso alt vazio.
export function CapaDoCard({ imagens, icone: Icone }) {
  return (
    <div className="client-card__capa">
      {imagens.length === 0 ? (
        <Icone size={32} strokeWidth={1.2} aria-hidden="true" />
      ) : (
        imagens.slice(0, 2).map((src) => <img key={src} src={src} alt="" loading="lazy" />)
      )}
      {imagens.length > 2 && <span className="client-card__mais">+{imagens.length - 2}</span>}
    </div>
  )
}
