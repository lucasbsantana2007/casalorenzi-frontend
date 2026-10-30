import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'

// Busca de novo a cada `intervaloMs` enquanto a aba está visível e entrega o resultado sem mostrar "carregando":
// mensagens novas aparecem sozinhas (ex.: o cliente respondeu pelo WhatsApp). Só entrega quando algo mudou;
// falha de rede não aparece na tela, a próxima volta tenta de novo.
// `chave` identifica o que se busca (o chamado, os filtros): ao mudar, a busca em andamento é descartada.
// Devolve `aplicarAgora(dados)`, para a tela gravar o que ela mesma alterou (ex.: a resposta enviada): a busca que
// já estava em andamento chega com dados de antes e não apaga a mensagem que acabou de aparecer.
export function useAtualizacaoAutomatica(buscar, aplicar, { intervaloMs = 5000, ativo = true, chave = '' } = {}) {
  const buscarRef = useRef(buscar)
  const aplicarRef = useRef(aplicar)
  const ultimoRef = useRef(null)
  const geracaoRef = useRef(0)

  useLayoutEffect(() => {
    buscarRef.current = buscar
    aplicarRef.current = aplicar
  })

  useEffect(() => {
    geracaoRef.current += 1
    ultimoRef.current = null
  }, [chave])

  useEffect(() => {
    if (!ativo) return undefined
    let vivo = true
    let ocupado = false
    const atualizar = async () => {
      if (ocupado || document.visibilityState !== 'visible') return
      ocupado = true
      const geracao = geracaoRef.current
      try {
        const dados = await buscarRef.current()
        const assinatura = JSON.stringify(dados)
        if (vivo && geracao === geracaoRef.current && assinatura !== ultimoRef.current) {
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

  return useCallback((dados) => {
    geracaoRef.current += 1
    ultimoRef.current = null
    aplicarRef.current(dados)
  }, [])
}
