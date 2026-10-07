import { Link } from 'react-router-dom'
import camisaria from '../assets/colecao/camisaria.jpg'
import oscarFreire from '../assets/lojas/oscar-freire.jpg'

// Texto de demonstração: história fictícia da Casa Lorenzi (marca do case do trainee).
// Trocar pelo texto oficial quando a marca enviar.
const CAPITULOS = [
  {
    marco: '1994',
    titulo: 'O ateliê',
    texto: [
      'Tudo começou num pequeno ateliê na Rua Oscar Freire, em São Paulo: uma mesa de corte, uma tesoura e a ideia de que roupa boa é feita para durar.',
      'Os primeiros clientes chegavam por indicação, para ajustar um paletó ou encomendar uma calça sob medida. O endereço cresceu, mas continua sendo a nossa casa.',
    ],
    foto: oscarFreire,
    alt: 'Fachada da Casa Lorenzi na Rua Oscar Freire',
  },
  {
    marco: 'Os tecidos',
    titulo: 'O tecido vem antes do desenho',
    texto: [
      'Linho para os dias quentes, lã fria e cashmere para o inverno. Trabalhamos com matérias-primas naturais, escolhidas em tecelagens que conhecemos de perto.',
      'Cada peça é pensada a partir do caimento do tecido. Por isso ela atravessa estações em vez de acompanhar tendências.',
    ],
    foto: camisaria,
    alt: 'Camisa de linho cru pendurada num galho',
  },
  {
    marco: 'A rede',
    titulo: 'Cinco salões, o mesmo cuidado',
    texto: [
      'Depois de São Paulo vieram o Leblon, no Rio de Janeiro, o Pátio Batel, em Curitiba, e o Lago Norte, em Brasília. A mais nova é Belvedere, em Belo Horizonte.',
      'Em todas, o mesmo salão de parede clara, luz quente e poucas peças à mostra, com espaço em volta de cada uma.',
    ],
  },
  {
    marco: 'Hoje',
    titulo: 'Feito para durar',
    texto: [
      'Cada peça ainda passa pelas mãos de quem entende de caimento. O ajuste de barra e de manga continua sendo cortesia, como era no primeiro ateliê.',
    ],
  },
]

// Aba Lorenzi: parte da história da marca
export function LorenziPage() {
  return (
    <main className="store-section store-section--page historia">
      <header className="historia__intro">
        <p className="historia__eyebrow">Desde 1994</p>
        <h1 className="store-heading store-heading--lg">Lorenzi</h1>
        <p className="historia__lead">Uma alfaiataria que começou com uma tesoura, uma mesa de corte e muita paciência com o caimento de cada peça.</p>
      </header>

      <ol className="historia__capitulos">
        {CAPITULOS.map((c) => (
          <li key={c.marco} className={`historia__capitulo ${c.foto ? '' : 'historia__capitulo--texto'}`}>
            {c.foto && (
              <figure className="historia__foto">
                <img src={c.foto} alt={c.alt} loading="lazy" />
              </figure>
            )}
            <div className="historia__texto">
              <p className="historia__marco">{c.marco}</p>
              <h2 className="store-heading">{c.titulo}</h2>
              {c.texto.map((paragrafo) => (
                <p key={paragrafo}>{paragrafo}</p>
              ))}
            </div>
          </li>
        ))}
      </ol>

      <div className="historia__fim">
        <Link to="/lojas" className="store-heading-link">
          Conheça as lojas
        </Link>
      </div>
    </main>
  )
}
