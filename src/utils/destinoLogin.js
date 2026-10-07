// Depois de entrar: cliente vai para o perfil, equipe para a gestão. Quem tentou abrir uma
// página protegida da própria área volta para ela.
export function destinoPara(usuario, from) {
  const cliente = usuario.papel === 'CLIENTE'
  if (from && cliente === from.startsWith('/cliente')) return from
  return cliente ? '/cliente' : '/dashboard'
}
