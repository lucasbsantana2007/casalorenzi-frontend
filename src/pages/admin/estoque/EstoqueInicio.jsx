import { Navigate, useLocation } from 'react-router-dom'
import { useSession } from '../../../hooks/useSession'
import { ProdutosPage } from './ProdutosPage'

// Entrada da tela Estoque (/estoque): quem gerencia produtos abre na aba Produtos; os demais cargos,
// e links antigos com filtros de estoque (ex.: ?status=ALERTA), vão para a posição atual.
export function EstoqueInicio() {
  const { pode } = useSession()
  const { search } = useLocation()
  const params = new URLSearchParams(search)
  const filtrosDeEstoque = ['status', 'lojaId'].some((chave) => params.has(chave))
  if (pode('produtos') && !filtrosDeEstoque) return <ProdutosPage />
  return <Navigate to={`/estoque/posicao${search}`} replace />
}
