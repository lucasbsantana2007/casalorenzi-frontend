import arara from '../assets/colecao/arara.jpg'
import blazer from '../assets/colecao/blazer.jpg'
import cafe from '../assets/colecao/cafe.jpg'
import casacoCamel from '../assets/colecao/casaco-camel.jpg'
import casacoVermelho from '../assets/colecao/casaco-vermelho.jpg'
import camisaria from '../assets/colecao/camisaria.jpg'
import milao from '../assets/colecao/milao.jpg'
import pantheon from '../assets/colecao/pantheon.jpg'
import ruaItaliana from '../assets/colecao/rua-italiana.jpg'
import social from '../assets/colecao/social.jpg'
import tailleurBranco from '../assets/colecao/tailleur-branco.jpg'
import vestidoPortas from '../assets/colecao/vestido-portas.jpg'
import verao from '../assets/colecao/verao.jpg'

// Fotos ilustrativas (Unsplash) usadas enquanto o cadastro de produtos não tem imagens.
// Quando a API devolver `imagemUrl`, ela tem prioridade (ver imagemDoProduto).
const POR_PRODUTO = {
  1: camisaria,
  2: social,
  3: pantheon,
  4: blazer,
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
