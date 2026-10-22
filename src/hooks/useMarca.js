import { useLocation } from 'react-router-dom'
import { marcaDoCaminho } from '../data/marcas'

// Marca da vitrine aberta: /vulto/... é a Vulto; o resto do site, a Casa Lorenzi
export function useMarca() {
  return marcaDoCaminho(useLocation().pathname)
}
