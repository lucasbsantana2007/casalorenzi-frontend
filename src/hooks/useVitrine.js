import { useEffect, useState } from 'react'
import { produtosService } from '../services/produtosService'

const VALIDADE_MS = 5 * 60 * 1000
let cache = null // { quando, promessa }: abrir a busca de novo não refaz a chamada

function carregar() {
  if (!cache || Date.now() - cache.quando > VALIDADE_MS) {
    const promessa = produtosService.listar({ ativo: true }).catch((erro) => {
      cache = null
      throw erro
    })
    cache = { quando: Date.now(), promessa }
  }
  return cache.promessa
}

// Peças ativas da vitrine, só da Casa Lorenzi (a equipe logada também recebe as da Vulto).
// Usadas pela busca do cabeçalho; recarrega depois de 5 minutos.
export function useVitrine() {
  const [produtos, setProdutos] = useState([])
  useEffect(() => {
    let vivo = true
    carregar()
      .then((lista) => vivo && setProdutos(lista.filter((p) => (p.marca ?? 'LORENZI') === 'LORENZI')))
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [])
  return produtos
}
