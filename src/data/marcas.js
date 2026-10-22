import lorenzi from '../assets/marcas/lorenzi.png'
import lorenziBranca from '../assets/marcas/lorenzi-branca.png'
import vulto from '../assets/marcas/vulto.png'
import vultoBranca from '../assets/marcas/vulto-branca.png'

// As duas marcas do grupo num site só, cada uma com a sua vitrine: a Casa Lorenzi no início (/) e a
// Vulto em /vulto. Sacola, login, checkout e Vulto+ são compartilhados. `base` é o prefixo das rotas.
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
      { to: '/cliente/pontos', label: 'Vulto+' },
    ],
    rodape: 'Pinheiros · Eldorado · Savassi · Batel · site e app',
  },
}

export const LISTA_MARCAS = [MARCAS.LORENZI, MARCAS.VULTO]

const ehVulto = (caminho) => caminho === '/vulto' || caminho.startsWith('/vulto/')

export const marcaDoCaminho = (caminho) => (ehVulto(caminho) ? MARCAS.VULTO : MARCAS.LORENZI)

export const marcaDoProduto = (produto) => MARCAS[produto?.marca] ?? MARCAS.LORENZI

export const inicioDaMarca = (marca) => marca.base || '/'

// A peça abre na vitrine da marca dela
export const caminhoDoProduto = (produto) => `${marcaDoProduto(produto).base}/produto/${produto.id ?? produto.produtoId}`
