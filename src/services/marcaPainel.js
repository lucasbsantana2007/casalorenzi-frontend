import { getUsuarioSalvo } from './authStorage'

// Seletor de marca do painel do Administrador do grupo: Todas (null), Casa Lorenzi ou Vulto.
// Fica no navegador e vai para a API no cabeçalho X-Marca (src/services/api.js); quem é de uma marca
// só vê a dela, e o seletor não aparece.
const CHAVE = 'casalorenzi.marca-painel'
const EVENTO = 'marca-painel'

export function marcaEscolhida() {
  try {
    const valor = localStorage.getItem(CHAVE)
    return valor === 'LORENZI' || valor === 'VULTO' ? valor : null
  } catch {
    return null
  }
}

export function escolherMarca(marca) {
  try {
    if (marca) localStorage.setItem(CHAVE, marca)
    else localStorage.removeItem(CHAVE)
  } catch {
    // Sem armazenamento: o seletor vale só até recarregar
  }
  window.dispatchEvent(new Event(EVENTO))
}

export const aoMudarMarca = (callback) => {
  window.addEventListener(EVENTO, callback)
  return () => window.removeEventListener(EVENTO, callback)
}

// Marca que o membro da equipe enxerga: a dele; o do grupo, a do seletor (null = as duas)
export function marcaDoEscopo(usuario = getUsuarioSalvo()) {
  if (!usuario || usuario.papel === 'CLIENTE') return null
  if ((usuario.marca ?? 'LORENZI') === 'GRUPO') return marcaEscolhida()
  return usuario.marca ?? 'LORENZI'
}

export const naMarca = (escopo, marca) => !escopo || (marca ?? 'LORENZI') === escopo
