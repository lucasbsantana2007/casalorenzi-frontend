import { useCallback, useEffect, useMemo, useState } from 'react'
import { SacolaContext } from './sacolaContext'

// Sacola da loja. Fica no navegador do cliente (localStorage) até a compra ser finalizada.
// Item: { variacaoId, produtoId, nome, cor, tamanho, sku, preco, quantidade }
const CHAVE = 'casalorenzi.sacola'
const MAX_POR_ITEM = 5

function ler() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE))
    return Array.isArray(salvo) ? salvo : []
  } catch {
    return []
  }
}

export function SacolaProvider({ children }) {
  const [itens, setItens] = useState(ler)
  // Sacola lateral (abre ao clicar em "Sacola" e ao adicionar uma peça)
  const [aberta, setAberta] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(itens))
    } catch {
      // Sem armazenamento (aba anônima, bloqueio): a sacola vale só nesta visita
    }
  }, [itens])

  const abrir = useCallback(() => setAberta(true), [])
  const fechar = useCallback(() => setAberta(false), [])

  const adicionar = useCallback((item) => {
    setAberta(true)
    setItens((atual) => {
      const existente = atual.find((i) => i.variacaoId === item.variacaoId)
      if (!existente) return [...atual, { ...item, quantidade: 1 }]
      return atual.map((i) => (i.variacaoId === item.variacaoId ? { ...i, quantidade: Math.min(i.quantidade + 1, MAX_POR_ITEM) } : i))
    })
  }, [])

  const alterarQuantidade = useCallback((variacaoId, quantidade) => {
    setItens((atual) =>
      quantidade <= 0
        ? atual.filter((i) => i.variacaoId !== variacaoId)
        : atual.map((i) => (i.variacaoId === variacaoId ? { ...i, quantidade: Math.min(quantidade, MAX_POR_ITEM) } : i)),
    )
  }, [])

  const remover = useCallback((variacaoId) => setItens((atual) => atual.filter((i) => i.variacaoId !== variacaoId)), [])
  const esvaziar = useCallback(() => setItens([]), [])

  const value = useMemo(
    () => ({
      itens,
      quantidadeTotal: itens.reduce((sum, i) => sum + i.quantidade, 0),
      subtotal: itens.reduce((sum, i) => sum + i.preco * i.quantidade, 0),
      maxPorItem: MAX_POR_ITEM,
      aberta,
      abrir,
      fechar,
      adicionar,
      alterarQuantidade,
      remover,
      esvaziar,
    }),
    [itens, aberta, abrir, fechar, adicionar, alterarQuantidade, remover, esvaziar],
  )

  return <SacolaContext.Provider value={value}>{children}</SacolaContext.Provider>
}
