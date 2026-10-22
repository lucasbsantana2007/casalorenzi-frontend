import { cadastrosService } from '../services/cadastrosService'
import { freteService } from '../services/freteService'
import { useAsync } from './useAsync'

// Cadastros de apoio (lojas, categorias, usuários) usados em filtros e formulários.
// marca: só as lojas físicas dessa marca (página Lojas de cada vitrine); sem ela, o padrão da API
export function useLojas(marca) {
  return useAsync(() => cadastrosService.listarLojas(marca ? { marca } : undefined), [marca]).data ?? []
}

export function useCategorias() {
  return useAsync(() => cadastrosService.listarCategorias(), []).data ?? []
}

export function useEquipe() {
  return useAsync(() => cadastrosService.listarUsuarios(), []).data ?? []
}

// Condições públicas de frete (valores, prazos e mínimo para frete grátis); null enquanto carrega
export function useCondicoesFrete() {
  return useAsync(() => freteService.condicoes(), []).data ?? null
}
