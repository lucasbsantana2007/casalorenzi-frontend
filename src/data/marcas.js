import lorenzi from '../assets/marcas/lorenzi.webp'
import lorenziBranca from '../assets/marcas/lorenzi-branca.webp'
import vulto from '../assets/marcas/vulto.webp'
import vultoBranca from '../assets/marcas/vulto-branca.webp'

// As duas marcas do grupo num site só, cada uma com a sua vitrine: a Casa Lorenzi no início (/) e a
// Vulto em /vulto. Sacola, login, checkout e Lupe+ são compartilhados. `base` é o prefixo das rotas.
export const MARCAS = {
  LORENZI: {
    id: 'LORENZI',
    nome: 'Casa Lorenzi',
    base: '',
    logo: lorenzi,
    logoBranca: lorenziBranca,
    nav: [
      { to: '/colecao/masculino', label: 'Masculino' },
      { to: '/colecao/feminino', label: 'Feminino' },
      { to: '/lojas', label: 'Lojas' },
      { to: '/lorenzi', label: 'Lorenzi' },
      // A outra marca do grupo, escrita na identidade desta (a faixa do topo fica recolhida)
      { to: '/vulto', label: 'Vulto' },
    ],
    rodape: 'Oscar Freire · Lago Norte · Leblon · Pátio Batel · Belvedere',
  },
  VULTO: {
    id: 'VULTO',
    nome: 'Vulto',
    base: '/vulto',
    logo: vulto,
    logoBranca: vultoBranca,
    nav: [
      { to: '/vulto/loja', label: 'Loja' },
      { to: '/vulto/lojas', label: 'Lojas' },
      { to: '/cliente/pontos', label: 'Lupe+' },
      { to: '/', label: 'Lorenzi' },
    ],
    rodape: 'Pinheiros · Eldorado · Savassi · Batel · site e app',
  },
}

export const LISTA_MARCAS = [MARCAS.LORENZI, MARCAS.VULTO]

// Marca de cada funcionário e de cada loja no painel (GRUPO: Administrador que vê as duas)
export const NOMES_MARCAS = { LORENZI: 'Casa Lorenzi', VULTO: 'Vulto', GRUPO: 'Grupo' }

// As duas juntas: área do cliente (uma conta só nas duas marcas). Cabeçalho e rodapé com as duas logos
export const GRUPO = {
  id: 'GRUPO',
  nome: 'Casa Lorenzi e Vulto',
  base: '',
  nav: [
    { to: '/', label: 'Casa Lorenzi' },
    { to: '/vulto', label: 'Vulto' },
  ],
  rodape: 'Uma conta, duas marcas, os mesmos pontos Lupe+',
}

const ehVulto = (caminho) => caminho === '/vulto' || caminho.startsWith('/vulto/')

export const marcaDoCaminho = (caminho) => (ehVulto(caminho) ? MARCAS.VULTO : MARCAS.LORENZI)

export const marcaDoProduto = (produto) => MARCAS[produto?.marca] ?? MARCAS.LORENZI

export const inicioDaMarca = (marca) => marca.base || '/'

// Telas de acesso de cada marca (/login e /vulto/login): a mesma conta e o mesmo destino depois de
// entrar (cliente → /cliente, equipe → /dashboard); só muda a identidade. resto: '/criar-conta' etc.
export const loginDaMarca = (marca, resto = '') => `${marca.base}/login${resto}`

// A peça abre na vitrine da marca dela
export const caminhoDoProduto = (produto) => `${marcaDoProduto(produto).base}/produto/${produto.id ?? produto.produtoId}`
