import arara from '../assets/colecao/arara.jpg'
import cafe from '../assets/colecao/cafe.jpg'
import calcaAlfaiataria from '../assets/colecao/calca-alfaiataria.jpg'
import camisaria from '../assets/colecao/camisaria.jpg'
import casacoCamel from '../assets/colecao/casaco-camel.jpg'
import casacoVermelho from '../assets/colecao/casaco-vermelho.jpg'
import jaquetaCamurca from '../assets/colecao/jaqueta-camurca.jpg'
import milao from '../assets/colecao/milao.jpg'
import ruaItaliana from '../assets/colecao/rua-italiana.jpg'
import social from '../assets/colecao/social.jpg'
import tailleurBranco from '../assets/colecao/tailleur-branco.jpg'
import verao from '../assets/colecao/verao.jpg'
import vestidoPortas from '../assets/colecao/vestido-portas.jpg'

// Fotos ilustrativas (Unsplash) usadas enquanto o cadastro de produtos não tem imagens.
// Quando a API devolver `imagemUrl`, ela tem prioridade (ver imagemDoProduto).
const POR_PRODUTO = {
  1: camisaria,
  2: social,
  3: calcaAlfaiataria,
  4: jaquetaCamurca,
  5: verao,
  6: tailleurBranco,
  7: vestidoPortas,
  8: casacoCamel,
  9: cafe,
  10: casacoVermelho,
  11: milao,
  12: ruaItaliana,
}

export const imagemDoProduto = (produto) => produto.imagemUrl ?? POR_PRODUTO[produto.id] ?? arara

// Ordem das peças na vitrine (ids dos produtos). Quem não está na lista vem depois, na ordem da API.
const ORDEM_VITRINE = [
  // Masculino
  4, 3, 2, 1, 11, 8,
]

export function ordenarVitrine(produtos) {
  const posicao = (p) => {
    const i = ORDEM_VITRINE.indexOf(p.id)
    return i === -1 ? ORDEM_VITRINE.length : i
  }
  return [...produtos].sort((a, b) => posicao(a) - posicao(b))
}
