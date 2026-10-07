import { Minus, Plus, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { imagemDoProduto } from '../../data/imagensProdutos'
import { useCondicoesFrete } from '../../hooks/useCadastros'
import { useSacola } from '../../hooks/useSacola'
import { formatCurrency } from '../../utils/format'

// Sacola lateral: abre por cima da página ao clicar em "Sacola" ou ao adicionar uma peça
export function SacolaLateral() {
  const { itens, subtotal, quantidadeTotal, maxPorItem, aberta, fechar, alterarQuantidade, remover } = useSacola()
  const painelRef = useRef(null)
  const { pathname } = useLocation()
  const frete = useCondicoesFrete()
  const faltaFreteGratis = frete ? frete.gratisMinimo - subtotal : 0

  // Fecha ao trocar de página (ex.: clicou num produto ou em "Finalizar compra")
  useEffect(() => {
    fechar()
  }, [pathname, fechar])

  useEffect(() => {
    if (!aberta) return undefined
    const anterior = document.activeElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    painelRef.current?.focus()
    const aoTeclar = (e) => e.key === 'Escape' && fechar()
    document.addEventListener('keydown', aoTeclar)
    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', aoTeclar)
      anterior?.focus?.()
    }
  }, [aberta, fechar])

  return (
    <div className={`drawer ${aberta ? 'is-open' : ''}`} aria-hidden={!aberta}>
      <div className="drawer__backdrop" onClick={fechar} />
      <aside className="drawer__panel" role="dialog" aria-modal="true" aria-label="Sacola" tabIndex={-1} ref={painelRef}>
        <header className="drawer__head">
          <h2>
            Sacola {quantidadeTotal > 0 && <span>({quantidadeTotal})</span>}
          </h2>
          <button type="button" className="drawer__close" onClick={fechar} aria-label="Fechar sacola">
            <X size={22} strokeWidth={1.4} />
          </button>
        </header>

        {itens.length === 0 ? (
          <div className="drawer__empty">
            <p>Sua sacola está vazia.</p>
            <div className="bag-empty__links">
              <Link to="/colecao/masculino">Masculino</Link>
              <Link to="/colecao/feminino">Feminino</Link>
            </div>
          </div>
        ) : (
          <>
            <ul className="drawer__items">
              {itens.map((item) => (
                <li key={item.variacaoId} className="drawer-item">
                  <Link to={`/produto/${item.produtoId}`} className="drawer-item__image">
                    <img src={imagemDoProduto({ id: item.produtoId, imagemUrl: item.imagemUrl })} alt={item.nome} />
                  </Link>
                  <div className="drawer-item__info">
                    <Link to={`/produto/${item.produtoId}`} className="drawer-item__name">
                      {item.nome}
                    </Link>
                    <span className="drawer-item__meta">
                      {item.cor} / {item.tamanho}
                    </span>
                    <div className="drawer-item__qty">
                      <span>Qtd.:</span>
                      <button type="button" onClick={() => alterarQuantidade(item.variacaoId, item.quantidade - 1)} aria-label={`Diminuir ${item.nome}`}>
                        <Minus size={12} />
                      </button>
                      <span aria-live="polite">{item.quantidade}</span>
                      <button
                        type="button"
                        onClick={() => alterarQuantidade(item.variacaoId, item.quantidade + 1)}
                        disabled={item.quantidade >= maxPorItem}
                        aria-label={`Aumentar ${item.nome}`}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="drawer-item__side">
                    <span>{formatCurrency(item.preco * item.quantidade)}</span>
                    <button type="button" onClick={() => remover(item.variacaoId)}>
                      Remover
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="drawer__foot">
              <div className="drawer__subtotal">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <p className="drawer__hint">
                {faltaFreteGratis > 0 ? `Faltam ${formatCurrency(faltaFreteGratis)} para frete grátis` : 'Frete Padrão grátis'}
              </p>
              <Link to="/checkout" className="drawer__btn">
                Finalizar compra
              </Link>
              <button type="button" className="drawer__btn drawer__btn--ghost" onClick={fechar}>
                Continuar comprando
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  )
}
