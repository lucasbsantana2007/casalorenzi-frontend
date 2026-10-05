import { cadastrosService } from '../services/cadastrosService'
import { useAsync } from './useAsync'

// Cadastros de apoio (lojas, categorias, usuários) usados em filtros e formulários.
export function useLojas() {
  return useAsync(() => cadastrosService.listarLojas(), []).data ?? []
}

export function useCategorias() {
  return useAsync(() => cadastrosService.listarCategorias(), []).data ?? []
}

export function useEquipe() {
  return useAsync(() => cadastrosService.listarUsuarios(), []).data ?? []
}
