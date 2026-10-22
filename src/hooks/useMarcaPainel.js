import { useEffect, useState } from 'react'
import { aoMudarMarca, escolherMarca, marcaEscolhida } from '../services/marcaPainel'
import { useSession } from './useSession'

// Marca do painel: { marca, grupo, escolher }. marca = a do funcionário; para o Administrador do grupo,
// a do seletor (null = as duas). grupo = vê as duas marcas (mostra o seletor e as duas logos).
export function useMarcaPainel() {
  const { usuario } = useSession()
  const grupo = (usuario?.marca ?? 'LORENZI') === 'GRUPO'
  const [escolhida, setEscolhida] = useState(marcaEscolhida)
  useEffect(() => aoMudarMarca(() => setEscolhida(marcaEscolhida())), [])
  return {
    grupo,
    marca: grupo ? escolhida : (usuario?.marca ?? 'LORENZI'),
    escolher: escolherMarca,
  }
}
