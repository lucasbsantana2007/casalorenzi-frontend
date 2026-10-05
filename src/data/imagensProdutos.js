import acessorios from '../assets/colecao/acessorios.jpg'
import arara from '../assets/colecao/arara.jpg'
import camisaria from '../assets/colecao/camisaria.jpg'
import compras from '../assets/colecao/compras.jpg'
import feminino from '../assets/colecao/feminino.jpg'
import inverno from '../assets/colecao/inverno.jpg'
import malha from '../assets/colecao/malha.jpg'
import masculino from '../assets/colecao/masculino.jpg'
import social from '../assets/colecao/social.jpg'
import terno from '../assets/colecao/terno.jpg'
import trico from '../assets/colecao/trico.jpg'
import verao from '../assets/colecao/verao.jpg'

// Fotos ilustrativas (Unsplash) usadas enquanto o cadastro de produtos não tem imagens.
// Quando a API devolver `imagemUrl`, ela tem prioridade (ver imagemDoProduto).
const POR_PRODUTO = {
  1: camisaria,
  2: social,
  3: terno,
  4: masculino,
  5: verao,
  6: trico,
  7: malha,
  8: arara,
  9: feminino,
  10: inverno,
  11: acessorios,
  12: compras,
}

export const imagemDoProduto = (produto) => produto.imagemUrl ?? POR_PRODUTO[produto.id] ?? arara
