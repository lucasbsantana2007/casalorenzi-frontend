import { ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MapaLojas } from '../components/loja/MapaLojas'
import { nomeCurto } from '../data/coordenadasLojas'
import { fotoDaLoja } from '../data/fotosLojas'
import { useMarca } from '../hooks/useMarca'
import { useLojas } from '../hooks/useCadastros'

// Página Lojas das duas marcas (/lojas e /vulto/lojas): mapa, lista e a foto de cada loja
export function LojasPage() {
  const marca = useMarca()
  // Loja desativada no cadastro sai do site
  const lojas = useLojas(marca.id).filter((loja) => loja.ativa !== false)
  // Passar o mouse na lista acende o ponto no mapa, e vice-versa
  const [ativa, setAtiva] = useState(null)
  // Loja com foto e informações abertas: clique no nome ou no ponto do mapa
  // ?loja=<id> (links do início da Vulto): já abre essa loja e rola até ela
  const [params] = useSearchParams()
  const pedida = Number(params.get('loja')) || null
  const [aberta, setAberta] = useState(pedida)
  const carregou = lojas.length > 0
  useEffect(() => {
    if (!pedida || !carregou) return
    requestAnimationFrame(() => document.getElementById(`loja-${pedida}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
  }, [pedida, carregou])

  const alternar = (id) => setAberta((atual) => (atual === id ? null : id))

  const abrirPeloMapa = (id) => {
    alternar(id)
    // No celular a lista fica embaixo do mapa
    requestAnimationFrame(() => document.getElementById(`loja-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }))
  }

  return (
    <main className="store-section store-section--page">
      <div className="store-section__head">
        <h1 className="store-heading store-heading--lg">Lojas</h1>
      </div>
      <div className="lojas-mapa">
        <MapaLojas lojas={lojas} ativa={ativa ?? aberta} onAtivar={setAtiva} onSelecionar={abrirPeloMapa} />
        <ul className="store-list">
          {lojas.map((loja) => {
            const detalhes = loja.endereco ? { ...loja, foto: fotoDaLoja(loja) } : null
            const estaAberta = aberta === loja.id
            return (
              <li
                key={loja.id}
                id={`loja-${loja.id}`}
                className={(ativa ?? aberta) === loja.id ? 'is-ativa' : undefined}
                onMouseEnter={() => setAtiva(loja.id)}
                onMouseLeave={() => setAtiva(null)}
              >
                <button
                  type="button"
                  className="store-list__toggle"
                  onClick={() => alternar(loja.id)}
                  aria-expanded={detalhes ? estaAberta : undefined}
                  aria-controls={detalhes ? `loja-${loja.id}-detalhes` : undefined}
                  disabled={!detalhes}
                >
                  <strong>
                    {nomeCurto(loja)}
                    {detalhes && <ChevronDown className="store-list__seta" size={14} strokeWidth={1.5} aria-hidden="true" />}
                  </strong>
                  <span>
                    {loja.cidade}, {loja.uf}
                  </span>
                </button>
                {detalhes && estaAberta && (
                  <div className="store-list__detalhes" id={`loja-${loja.id}-detalhes`}>
                    {detalhes.foto && <img src={detalhes.foto} alt={`Fachada da ${loja.nome.startsWith(marca.nome) ? loja.nome : `${marca.nome} ${loja.nome}`}`} />}
                    <dl>
                      <div>
                        <dt>Endereço</dt>
                        <dd>{detalhes.endereco}</dd>
                      </div>
                      {detalhes.telefone && (
                        <div>
                          <dt>Contato</dt>
                          <dd>
                            <a href={`tel:${detalhes.telefone.replace(/[^\d+]/g, '')}`}>{detalhes.telefone}</a>
                          </dd>
                        </div>
                      )}
                      {detalhes.horarios?.length > 0 && (
                        <div>
                          <dt>Horários</dt>
                          {detalhes.horarios.map((linha) => (
                            <dd key={linha}>{linha}</dd>
                          ))}
                        </div>
                      )}
                    </dl>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </main>
  )
}
