import { imagemDoProduto } from '../../data/imagensProdutos'
import { useAsync } from '../../hooks/useAsync'
import { produtosService } from '../../services/produtosService'
import { formatCurrency } from '../../utils/format'
import { AsyncContent } from '../ui/AsyncContent'
import { EmptyState } from '../ui/EmptyState'
import { FILTROS_VITRINE } from './filtros'

const combina = (produto, filtro) =>
  filtro === 'Todos' || produto.genero === filtro || produto.estacao === filtro || (produto.estacao === 'Atemporal' && ['Inverno', 'Verão'].includes(filtro))

function resumoGrade(variacoes) {
  const cores = new Set(variacoes.map((v) => v.cor)).size
  const tamanhos = [...new Set(variacoes.map((v) => v.tamanho))]
  const grade = tamanhos.length > 1 ? `${tamanhos[0]} ao ${tamanhos.at(-1)}` : tamanhos[0]
  return `${cores} ${cores > 1 ? 'cores' : 'cor'} · ${grade === 'Único' ? 'tamanho único' : grade}`
}

export function CollectionSection({ filtro, onFiltrar }) {
  const state = useAsync(() => produtosService.listar({ ativo: true }), [])
  const produtos = (state.data ?? []).filter((p) => combina(p, filtro))

  return (
    <section id="colecao" className="store-container store-section">
      <div className="store-section__heading">
        <div>
          <p className="store-eyebrow">A coleção</p>
          <h2 className="store-title">Peças para durar</h2>
        </div>
        <div className="chip-group" role="group" aria-label="Filtrar coleção">
          {['Todos', ...FILTROS_VITRINE].map((opcao) => (
            <button key={opcao} type="button" className={filtro === opcao ? 'is-active' : ''} aria-pressed={filtro === opcao} onClick={() => onFiltrar(opcao, false)}>
              {opcao}
            </button>
          ))}
        </div>
      </div>

      <AsyncContent state={{ ...state, data: state.data && produtos }} empty={<EmptyState title="Nenhuma peça nesta seleção" />}>
        {(lista) => (
          <ul className="product-grid">
            {lista.map((produto) => (
              <li key={produto.id} className="product-card">
                <div className="product-card__image">
                  <img src={imagemDoProduto(produto)} alt="" loading="lazy" />
                  {produto.estoqueTotal > 0 && produto.estoqueTotal <= 12 && <span className="product-card__tag">Últimas peças</span>}
                </div>
                <p className="product-card__category">{produto.categoria}</p>
                <h3>{produto.nome}</h3>
                <p className="product-card__price">{formatCurrency(produto.precoBase)}</p>
                <p className="product-card__meta">{resumoGrade(produto.variacoes)}</p>
              </li>
            ))}
          </ul>
        )}
      </AsyncContent>
    </section>
  )
}
