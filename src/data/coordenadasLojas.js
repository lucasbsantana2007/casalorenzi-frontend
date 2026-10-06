// Onde cada loja fica no mapa da página Lojas. A chave é o nome da loja (vem da API).
// lado: de que lado do ponto o nome aparece, para os rótulos das lojas próximas não se encostarem.
// Loja sem entrada aqui continua na lista, só não aparece no mapa.
export const COORDENADAS_LOJAS = {
  'Oscar Freire': { lat: -23.5636, lng: -46.6713, lado: 'esquerda' },
  'Lago Sul': { lat: -15.842, lng: -47.864, lado: 'direita' },
  Leblon: { lat: -22.984, lng: -43.2235, lado: 'direita' },
  'Pátio Batel': { lat: -25.4433, lng: -49.2894, lado: 'esquerda' },
  Belvedere: { lat: -19.975, lng: -43.945, lado: 'direita' },
}

// Loja de onde saem as linhas do mapa (a matriz).
export const LOJA_MATRIZ = 'Oscar Freire'
