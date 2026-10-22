// Peças da Vulto sem foto (o catálogo migrado não tem imagens): um card tipográfico em SVG, na cor da
// peça, com o nome em caixa alta pesada e o corte diagonal do O da logo. Serve como `src` de <img>.

// Cores do catálogo da Vulto → fundo do card. Cor desconhecida cai no preto da marca.
const CORES = {
  preto: '#17191c',
  branco: '#f4f3ef',
  'off white': '#ebe6da',
  bege: '#d9c8a9',
  marrom: '#6b4a34',
  vinho: '#5c1f2b',
  'verde oliva': '#5b6236',
  'azul marinho': '#1d2a44',
  amarelo: '#e8c547',
  'lilás': '#b9a5d6',
  'cinza mescla': '#9a9a98',
  'jeans claro': '#8fa8c4',
  'jeans escuro': '#34496a',
  azul: '#2f5fa7',
  verde: '#2f6b4f',
  vermelho: '#b8332a',
  rosa: '#e3a6b4',
  laranja: '#e0713a',
}
const PRETO = '#17191c'

const corDoFundo = (cor) => CORES[String(cor ?? '').trim().toLowerCase()] ?? PRETO

// Texto preto em fundo claro e branco em fundo escuro
function corDoTexto(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.55 ? PRETO : '#ffffff'
}

const escapar = (texto) => String(texto).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Quebra o nome em linhas de até ~11 caracteres (a fonte é larga), no máximo 4
function linhas(nome) {
  const saida = []
  for (const palavra of String(nome).toUpperCase().split(/\s+/)) {
    const ultima = saida.at(-1)
    if (ultima && `${ultima} ${palavra}`.length <= 11) saida[saida.length - 1] = `${ultima} ${palavra}`
    else saida.push(palavra)
  }
  return saida.slice(0, 4)
}

const cache = new Map()

export function cardDaVulto({ nome, cor, codigo }) {
  const chave = `${nome}|${cor}|${codigo ?? ''}`
  if (cache.has(chave)) return cache.get(chave)
  const fundo = corDoFundo(cor)
  const tinta = corDoTexto(fundo)
  const texto = linhas(nome)
  const tamanho = texto.some((l) => l.length > 9) ? 92 : 112
  const topo = 1000 - 120 - (texto.length - 1) * tamanho * 0.98
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000">
<rect width="800" height="1000" fill="${fundo}"/>
<g fill="none" stroke="${tinta}" stroke-opacity="0.16" stroke-width="56">
<ellipse cx="560" cy="380" rx="230" ry="250"/></g>
<path d="M705 160 L760 105 L790 135 L735 190 Z" fill="${fundo}"/>
<line x1="610" y1="300" x2="770" y2="140" stroke="${fundo}" stroke-width="22"/>
<text x="56" y="104" fill="${tinta}" font-family="'Arial Black','Helvetica Neue',Arial,sans-serif" font-weight="900" font-size="46" letter-spacing="2">VULTO</text>
${codigo ? `<text x="744" y="104" text-anchor="end" fill="${tinta}" fill-opacity="0.7" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="30" letter-spacing="3">${escapar(codigo)}</text>` : ''}
${texto
  .map(
    (linha, i) =>
      `<text x="52" y="${Math.round(topo + i * tamanho * 0.98)}" fill="${tinta}" font-family="'Arial Black','Helvetica Neue',Arial,sans-serif" font-weight="900" font-size="${tamanho}" letter-spacing="-2">${escapar(linha)}</text>`,
  )
  .join('\n')}
${cor ? `<text x="56" y="${Math.round(topo - tamanho - 4)}" fill="${tinta}" fill-opacity="0.75" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="28" letter-spacing="4">${escapar(String(cor).toUpperCase())}</text>` : ''}
</svg>`
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  cache.set(chave, url)
  return url
}
