import { useEffect, useLayoutEffect, useRef } from 'react'

// Busca de novo a cada `intervaloMs` enquanto a aba está visível e entrega o resultado sem mostrar "carregando":
// mensagens novas aparecem sozinhas (ex.: o cliente respondeu pelo WhatsApp). Só entrega quando algo mudou;
// falha de rede não aparece na tela, a próxima volta tenta de novo.
export function useAtualizacaoAutomatica(buscar, aplicar, { intervaloMs = 5000, ativo = true } = {}) {
  const buscarRef = useRef(buscar)
  const aplicarRef = useRef(aplicar)
  const ultimoRef = useRef(null)

  useLayoutEffect(() => {
    buscarRef.current = buscar
    aplicarRef.current = aplicar
  })

  useEffect(() => {
    if (!ativo) return undefined
    let vivo = true
    let ocupado = false
    const atualizar = async () => {
      if (ocupado || document.visibilityState !== 'visible') return
      ocupado = true
      try {
        const dados = await buscarRef.current()
        const assinatura = JSON.stringify(dados)
        if (vivo && assinatura !== ultimoRef.current) {
          ultimoRef.current = assinatura
          aplicarRef.current(dados)
        }
      } catch {
        // sem rede ou API acordando: tenta na próxima volta
      } finally {
        ocupado = false
      }
    }
    const intervalo = setInterval(atualizar, intervaloMs)
    document.addEventListener('visibilitychange', atualizar)
    return () => {
      vivo = false
      clearInterval(intervalo)
      document.removeEventListener('visibilitychange', atualizar)
    }
  }, [intervaloMs, ativo])
}
