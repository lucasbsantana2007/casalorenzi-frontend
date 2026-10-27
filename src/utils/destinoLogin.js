// Depois de entrar: cliente vai para o perfil, equipe para a gestão. Quem tentou abrir uma
// página protegida da própria área volta para ela (e o cliente vindo da página de uma peça volta para a peça).
export function destinoPara(usuario, from) {
  const cliente = usuario.papel === 'CLIENTE'
  if (from && cliente === from.startsWith('/cliente')) return from
  // Cliente que entrou pelo "Avise-me" da página da peça volta para a peça
  if (from && cliente && /^\/(vulto\/)?produto\/\d+$/.test(from)) return from
  return cliente ? '/cliente' : '/dashboard'
}
