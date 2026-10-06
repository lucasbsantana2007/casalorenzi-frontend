// Preparo de fotos anexadas pelo cliente (ex.: defeito da peça, comprovante).
// A foto é reduzida no próprio navegador antes do envio: arquivos de celular passam de 5 MB,
// e a API aceita no máximo 2 MB por anexo.

export const TIPOS_IMAGEM = ['image/jpeg', 'image/png', 'image/webp']
export const TAMANHO_ORIGINAL_MAX = 15 * 1024 * 1024 // antes de reduzir
export const TAMANHO_ANEXO_MAX = 2 * 1024 * 1024 // depois de reduzir (limite da API)
const LADO_MAX = 1280
const QUALIDADES = [0.82, 0.7, 0.55]

export function formatarTamanho(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`
}

// Bytes reais de um conteúdo em base64 (sem o prefixo "data:...;base64,")
export function bytesDoBase64(base64) {
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0
  return Math.floor((base64.length * 3) / 4) - padding
}

async function carregarImagem(arquivo) {
  // createImageBitmap já respeita a orientação EXIF (fotos de celular "deitadas")
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(arquivo, { imageOrientation: 'from-image' })
    } catch {
      // Navegador sem suporte ao formato/opção: tenta pelo <img>
    }
  }
  const url = URL.createObjectURL(arquivo)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

// Valida e reduz a foto (no máximo 1280 px no maior lado, JPEG ~0.82).
// → { nome, tipo, conteudoBase64, url, tamanho } — `url` é o data URL para a pré-visualização
export async function prepararFoto(arquivo) {
  if (!TIPOS_IMAGEM.includes(arquivo.type)) throw new Error('Envie uma foto em JPG, PNG ou WebP.')
  if (arquivo.size > TAMANHO_ORIGINAL_MAX) {
    throw new Error(`Esta foto tem ${formatarTamanho(arquivo.size)}. Escolha uma de até ${formatarTamanho(TAMANHO_ORIGINAL_MAX)}.`)
  }

  let imagem
  try {
    imagem = await carregarImagem(arquivo)
  } catch {
    throw new Error('Não conseguimos abrir esta imagem. Tente outra foto.')
  }

  const largura = imagem.width
  const altura = imagem.height
  const escala = Math.min(1, LADO_MAX / Math.max(largura, altura))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(largura * escala)
  canvas.height = Math.round(altura * escala)
  const ctx = canvas.getContext('2d')
  // PNG/WebP com transparência: fundo branco, já que o JPEG não tem canal alfa
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(imagem, 0, 0, canvas.width, canvas.height)
  imagem.close?.()

  for (const qualidade of QUALIDADES) {
    const url = canvas.toDataURL('image/jpeg', qualidade)
    const conteudoBase64 = url.slice(url.indexOf(',') + 1)
    const tamanho = bytesDoBase64(conteudoBase64)
    if (tamanho <= TAMANHO_ANEXO_MAX) {
      const base = arquivo.name.replace(/\.[^.]+$/, '').trim() || 'foto'
      return { nome: `${base}.jpg`, tipo: 'image/jpeg', conteudoBase64, url, tamanho }
    }
  }
  throw new Error('Mesmo reduzida, a foto passou de 2 MB. Tente outra imagem.')
}
