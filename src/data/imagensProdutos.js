import arara from '../assets/colecao/arara.jpg'
import { cardDaVulto } from './cardsVulto'
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

// Fotos ilustrativas (Unsplash) dos produtos sem foto enviada.
// A foto enviada no cadastro (`imagemUrl`) sempre tem prioridade (ver imagemDoProduto).
// `imagemUrl` null (sem foto) também cai na ilustração.
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

// Fotos do catálogo da Vulto (frente e costas), pelo código do modelo (CAL-005, MOL-004...): valem para
// os dados de demonstração e para a API real, onde os ids das peças são outros
const FOTOS_VULTO = import.meta.glob('../assets/vulto/*.webp', { eager: true, import: 'default' })
const fotoDaVulto = (codigo, vista) => (codigo ? FOTOS_VULTO[`../assets/vulto/${codigo}-${vista}.webp`] : undefined)

// Foto principal da peça. Aceita o produto da API ou o item da sacola ({ produtoId, nome, cor, marca,
// codigoModelo, imagemUrl }). A foto enviada no cadastro vem primeiro; peça da Vulto sem foto nenhuma
// mostra o card tipográfico na cor da peça (cor: a escolhida; senão a da primeira variação).
export function imagemDoProduto(produto, cor) {
  if (produto.imagemUrl) return produto.imagemUrl
  if (produto.marca === 'VULTO') {
    return (
      fotoDaVulto(produto.codigoModelo, 'frente') ??
      cardDaVulto({ nome: produto.nome, cor: cor ?? produto.cor ?? produto.variacoes?.[0]?.cor, codigo: produto.codigoModelo })
    )
  }
  return POR_PRODUTO[produto.id ?? produto.produtoId] ?? arara
}

// Todas as fotos da peça, na ordem da galeria (frente, costas). Lorenzi: uma só
export function fotosDoProduto(produto, cor) {
  const principal = imagemDoProduto(produto, cor)
  const costas = produto.marca === 'VULTO' ? fotoDaVulto(produto.codigoModelo, 'costas') : undefined
  return costas ? [principal, costas] : [principal]
}

// Uma foto por peça do pedido (a mesma peça em dois tamanhos aparece uma vez só)
export function imagensDoPedido(pedido) {
  const produtos = new Map(pedido.itens.map((i) => [i.variacao.produto.id, i.variacao.produto]))
  return [...produtos.values()].map(imagemDoProduto)
}

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
