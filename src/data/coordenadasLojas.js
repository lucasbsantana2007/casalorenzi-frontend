// Onde cada loja fica no mapa da página Lojas, pelo id da loja (renomear não tira a loja do mapa).
// lado: de que lado do ponto o nome aparece, para os rótulos das lojas próximas não se encostarem.
// Loja sem entrada aqui continua na lista, só não aparece no mapa.
export const COORDENADAS_LOJAS = {
  1: { lat: -23.5636, lng: -46.6713, lado: 'esquerda' },
  2: { lat: -15.7195, lng: -47.8866, lado: 'direita' },
  3: { lat: -22.984, lng: -43.2235, lado: 'direita' },
  4: { lat: -25.4433, lng: -49.2894, lado: 'esquerda' },
  5: { lat: -19.975, lng: -43.945, lado: 'direita' },
}

// Loja de onde saem as linhas do mapa (a matriz).
export const LOJA_MATRIZ_ID = 1

// Lojas da Vulto, pelo nome (os ids mudam entre a demonstração e a API real). Pinheiros e Eldorado
// ficam a 1 km uma da outra: rótulos em lados opostos
const COORDENADAS_VULTO = {
  'Vulto Pinheiros': { lat: -23.5665, lng: -46.69, lado: 'esquerda' },
  'Vulto Shopping Eldorado': { lat: -23.5727, lng: -46.6964, lado: 'direita' },
  'Vulto Savassi': { lat: -19.9387, lng: -43.9346, lado: 'direita' },
  'Vulto Batel': { lat: -25.442, lng: -49.287, lado: 'esquerda' },
}

export const coordenadasDaLoja = (loja) => (loja.marca === 'VULTO' ? COORDENADAS_VULTO[loja.nome] : COORDENADAS_LOJAS[loja.id])

// Nome curto para mapa e lista: as lojas da Vulto se chamam "Vulto Pinheiros" etc.
export const nomeCurto = (loja) => loja.nome.replace(/^Vulto\s+/, '')

// Matriz de cada marca (de onde saem as linhas): Oscar Freire na Lorenzi, Pinheiros na Vulto
export const ehMatriz = (loja) => (loja.marca === 'VULTO' ? loja.nome === 'Vulto Pinheiros' : loja.id === LOJA_MATRIZ_ID)
