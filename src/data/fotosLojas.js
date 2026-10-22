import batel from '../assets/lojas-vulto/batel.jpg'
import eldorado from '../assets/lojas-vulto/eldorado.jpg'
import pinheiros from '../assets/lojas-vulto/pinheiros.jpg'
import savassi from '../assets/lojas-vulto/savassi.jpg'
import belvedere from '../assets/lojas/belvedere.jpg'
import lagoNorte from '../assets/lojas/lago-norte.jpg'
import leblon from '../assets/lojas/leblon.jpg'
import oscarFreire from '../assets/lojas/oscar-freire.jpg'
import patioBatel from '../assets/lojas/patio-batel.jpg'

// Foto da fachada de cada loja na página Lojas, pelo id da loja (renomear não perde a foto).
// Loja nova sem foto aqui aparece sem imagem até ganhar uma (na API real: loja.fotoUrl).
export const FOTOS_LOJAS = {
  1: oscarFreire,
  2: lagoNorte,
  3: leblon,
  4: patioBatel,
  5: belvedere,
}

// Lojas da Vulto: pelo nome, porque os ids das lojas migradas mudam entre a demonstração e a API real
const FOTOS_VULTO = {
  'Vulto Pinheiros': pinheiros,
  'Vulto Shopping Eldorado': eldorado,
  'Vulto Savassi': savassi,
  'Vulto Batel': batel,
}

export const fotoDaLoja = (loja) => (loja.marca === 'VULTO' ? FOTOS_VULTO[loja.nome] : FOTOS_LOJAS[loja.id])
