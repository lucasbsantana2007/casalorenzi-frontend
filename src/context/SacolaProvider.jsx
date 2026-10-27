import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSession } from '../hooks/useSession'
import { contaService } from '../services/contaService'
import { SacolaContext } from './sacolaContext'

// Sacola da loja. Fica no navegador do cliente (localStorage) até a compra ser finalizada.
// Com o cliente logado, uma cópia vai para a API (decisão 100): serve para o lembrete de sacola abandonada e para
// a sacola aparecer em outro aparelho. O link do lembrete abre a sacola (?sacola=abrir).
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
  // Sacola lateral (abre ao clicar em "Sacola" e ao adicionar uma peça, ou pelo link do lembrete)
  const [aberta, setAberta] = useState(() => new URLSearchParams(window.location.search).get('sacola') === 'abrir')
  const { isCliente, clienteId } = useSession()
  // Cliente cuja sacola já foi conferida com a cópia da API (antes disso, nada é enviado)
  const [conferida, setConferida] = useState(null)

  // Ao entrar: sacola vazia neste aparelho traz a guardada; com peças, vale a deste aparelho
  useEffect(() => {
    if (!isCliente) return undefined
    let ativo = true
    contaService
      .sacola()
      .then(({ itens: guardados }) => {
        if (ativo && guardados?.length) setItens((atual) => (atual.length ? atual : guardados))
      })
      .catch(() => {})
      .finally(() => ativo && setConferida(clienteId))
    return () => {
      ativo = false
    }
  }, [isCliente, clienteId])

  // Depois, cada mudança vai para a API (com 1 s de espera, para não mandar a cada clique)
  useEffect(() => {
    if (!isCliente || conferida !== clienteId) return undefined
    const espera = setTimeout(() => {
      contaService.salvarSacola(itens.map((i) => ({ variacaoId: i.variacaoId, quantidade: i.quantidade }))).catch(() => {})
    }, 1000)
    return () => clearTimeout(espera)
  }, [itens, isCliente, clienteId, conferida])

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(itens))
    } catch {
      // Sem armazenamento (aba anônima, bloqueio): a sacola vale só nesta visita
    }
  }, [itens])

  const abrir = useCallback(() => setAberta(true), [])
  const fechar = useCallback(() => setAberta(false), [])

  // abrir: false quando a peça vem do chat (a sacola lateral cobriria a conversa)
  const adicionar = useCallback((item, { abrir: abrirSacola = true } = {}) => {
    if (abrirSacola) setAberta(true)
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
