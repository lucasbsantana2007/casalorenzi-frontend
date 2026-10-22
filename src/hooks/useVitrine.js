import { useEffect, useState } from 'react'
import { produtosService } from '../services/produtosService'

const VALIDADE_MS = 5 * 60 * 1000
const cache = {} // marca → { quando, promessa }: abrir a busca de novo não refaz a chamada

function carregar(marca) {
  const atual = cache[marca]
  if (!atual || Date.now() - atual.quando > VALIDADE_MS) {
    const promessa = produtosService.listar({ ativo: true, marca }).catch((erro) => {
      delete cache[marca]
      throw erro
    })
    cache[marca] = { quando: Date.now(), promessa }
  }
  return cache[marca].promessa
}

// Peças ativas da vitrine de uma marca (LORENZI ou VULTO). Usadas pela busca do cabeçalho, que procura
// na marca da vitrine aberta; recarrega depois de 5 minutos.
export function useVitrine(marca) {
  const [produtos, setProdutos] = useState([])
  useEffect(() => {
    let vivo = true
    carregar(marca)
      // A equipe logada recebe as duas marcas quando não pede uma; aqui sempre pede, mas confere
      .then((lista) => vivo && setProdutos(lista.filter((p) => (p.marca ?? 'LORENZI') === marca)))
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [marca])
  return produtos
}
