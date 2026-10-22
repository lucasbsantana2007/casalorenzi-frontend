import { useSearchParams } from 'react-router-dom'
import { useAsync } from '../../hooks/useAsync'
import { produtosService } from '../../services/produtosService'
import { Colecao } from '../ColecaoPage'

// Loja da Vulto: as peças não têm gênero (quase tudo é unissex), então é uma vitrine só, com os filtros
// de categoria, tamanho e preço. ?categoria= abre já filtrada.
export function VultoLojaPage() {
  const [params] = useSearchParams()
  const categoria = params.get('categoria')
  const state = useAsync(() => produtosService.listar({ ativo: true, marca: 'VULTO' }), [])
  return <Colecao key={categoria ?? ''} nome="Loja" categoria={categoria} state={state} />
}
