import arara from '../assets/colecao/arara.webp'
import { cardDaVulto } from './cardsVulto'
import cafe from '../assets/colecao/cafe.webp'
import calcaAlfaiataria from '../assets/colecao/calca-alfaiataria.webp'
import camisaria from '../assets/colecao/camisaria.webp'
import casacoCamel from '../assets/colecao/casaco-camel.webp'
import casacoVermelho from '../assets/colecao/casaco-vermelho.webp'
import jaquetaCamurca from '../assets/colecao/jaqueta-camurca.webp'
import milao from '../assets/colecao/milao.webp'
import ruaItaliana from '../assets/colecao/rua-italiana.webp'
import social from '../assets/colecao/social.webp'
import tailleurBranco from '../assets/colecao/tailleur-branco.webp'
import verao from '../assets/colecao/verao.webp'
import vestidoPortas from '../assets/colecao/vestido-portas.webp'

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

// Fotos da peça na ordem da galeria: [{ url, vista }] (frente, costas e no corpo, com modelo). Lorenzi: uma só
export function fotosDoProduto(produto, cor) {
  const fotos = [{ url: imagemDoProduto(produto, cor), vista: 'Frente' }]
  if (produto.marca !== 'VULTO') return fotos
  const costas = fotoDaVulto(produto.codigoModelo, 'costas')
  const modelo = fotoDaVulto(produto.codigoModelo, 'modelo')
  if (costas) fotos.push({ url: costas, vista: 'Costas' })
  if (modelo) fotos.push({ url: modelo, vista: 'No corpo' })
  return fotos
}

// Peça da Vulto com foto do catálogo (as outras mostram o card tipográfico)
export const temFoto = (produto) => Boolean(produto.imagemUrl || (produto.marca === 'VULTO' && fotoDaVulto(produto.codigoModelo, 'frente')))

// Foto que aparece na grade com o mouse em cima: a peça vestida; sem ela, as costas
export function fotoAlternativa(produto) {
  if (produto.marca !== 'VULTO') return undefined
  return fotoDaVulto(produto.codigoModelo, 'modelo') ?? fotoDaVulto(produto.codigoModelo, 'costas')
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

// Na Vulto, as peças com foto vêm primeiro (o catálogo migrado tem muitas sem)
export function ordenarVitrine(produtos) {
  const posicao = (p) => {
    const i = ORDEM_VITRINE.indexOf(p.id)
    return i === -1 ? ORDEM_VITRINE.length : i
  }
  return [...produtos].sort((a, b) => Number(temFoto(b)) - Number(temFoto(a)) || posicao(a) - posicao(b))
}
