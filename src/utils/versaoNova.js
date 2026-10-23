// Depois de um deploy, uma aba aberta com a versão anterior pede arquivos (as páginas carregadas sob
// demanda) que não existem mais no servidor: "Failed to fetch dynamically imported module". A saída é
// recarregar a página, que passa a usar a versão nova.
const CHAVE = 'casalorenzi.recarregou-versao'
const INTERVALO_MINIMO_MS = 10000

export function ehArquivoDeVersaoAntiga(erro) {
  const mensagem = String(erro?.message ?? erro ?? '')
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS/i.test(mensagem)
}

// Recarrega uma vez (no destino, se a falha veio de uma navegação); se já recarregou há menos de 10 s
// (o arquivo falta de verdade), não entra em loop
export function recarregarVersaoNova(destino = null) {
  try {
    const ultima = Number(sessionStorage.getItem(CHAVE) || 0)
    if (Date.now() - ultima < INTERVALO_MINIMO_MS) return false
    sessionStorage.setItem(CHAVE, String(Date.now()))
  } catch {
    // Sem armazenamento: recarrega mesmo assim
  }
  if (destino) window.location.assign(destino)
  else window.location.reload()
  return true
}

// Importa a página; se o arquivo for da versão antiga, recarrega em vez de mostrar erro.
// destino(): endereço para onde a pessoa estava indo (a navegação pendente), se houver
export async function importarComRecarga(carregar, destino = () => null) {
  try {
    return await carregar()
  } catch (erro) {
    if (ehArquivoDeVersaoAntiga(erro) && recarregarVersaoNova(destino())) return new Promise(() => {})
    throw erro
  }
}
