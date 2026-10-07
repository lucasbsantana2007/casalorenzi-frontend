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
