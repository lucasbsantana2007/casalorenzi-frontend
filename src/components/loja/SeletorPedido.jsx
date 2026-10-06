import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { imagemDoProduto } from '../../data/imagensProdutos'
import { formatCurrency, formatDate } from '../../utils/format'
import { StatusBadge } from '../ui/StatusBadge'

function ResumoPedido({ pedido }) {
  const [primeiro, ...outros] = pedido.itens
  return (
    <>
      <span className="order-pick__thumbs" aria-hidden="true">
        {pedido.itens.slice(0, 2).map((item) => (
          <img key={item.variacaoId} src={imagemDoProduto({ id: item.variacao.produto.id })} alt="" />
        ))}
      </span>
      <span className="order-pick__info">
        <strong>
          {primeiro.variacao.produto.nome}
          {outros.length > 0 && <span> + {outros.length}</span>}
        </strong>
        <small>
          {pedido.numero} · {formatDate(pedido.criadoEm)} · {formatCurrency(pedido.total)}
        </small>
      </span>
    </>
  )
}

// Seletor suspenso de pedido: mostra o escolhido; a seta abre a lista com foto, peças, data, total e status
export function SeletorPedido({ pedidos, value, onChange }) {
  const [aberto, setAberto] = useState(false)
  const ref = useRef(null)
  const listaId = useId()
  const rotuloId = useId()
  const escolhido = pedidos.find((p) => p.numero === value)

  useEffect(() => {
    if (!aberto) return undefined
    const fechar = (e) => {
      if (e.type === 'keydown' ? e.key === 'Escape' : !ref.current?.contains(e.target)) setAberto(false)
    }
    document.addEventListener('mousedown', fechar)
    document.addEventListener('keydown', fechar)
    return () => {
      document.removeEventListener('mousedown', fechar)
      document.removeEventListener('keydown', fechar)
    }
  }, [aberto])

  return (
    <div className="order-pick" ref={ref}>
      <span className="order-pick__label" id={rotuloId}>
        Pedido
      </span>
      <button
        type="button"
        className={`order-pick__trigger ${aberto ? 'is-open' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-controls={listaId}
        aria-labelledby={rotuloId}
        onClick={() => setAberto((v) => !v)}
      >
        {escolhido ? <ResumoPedido pedido={escolhido} /> : <span className="order-pick__placeholder">Selecione o pedido</span>}
        <ChevronDown size={16} className="order-pick__arrow" aria-hidden="true" />
      </button>

      {aberto && (
        <ul className="order-pick__menu" id={listaId} role="listbox" aria-labelledby={rotuloId}>
          {pedidos.map((p) => {
            const marcado = p.numero === value
            return (
              <li key={p.numero} role="option" aria-selected={marcado}>
                <button
                  type="button"
                  className={`order-pick__option ${marcado ? 'is-selected' : ''}`}
                  onClick={() => {
                    onChange(p.numero)
                    setAberto(false)
                  }}
                >
                  <ResumoPedido pedido={p} />
                  <StatusBadge type="pedido" value={p.status} />
                  <span className="order-pick__check" aria-hidden="true">
                    {marcado && <Check size={14} strokeWidth={2.5} />}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
