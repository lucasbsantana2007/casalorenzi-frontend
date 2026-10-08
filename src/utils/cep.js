// Consulta de CEP no ViaCEP (https://viacep.com.br): serviço público e gratuito, sem chave.
// Só o CEP sai do navegador. Usado no checkout para preencher rua, bairro, cidade e estado.

const TEMPO_LIMITE = 5000 // ms: se o ViaCEP demorar, a pessoa preenche à mão

// Devolve { rua, bairro, cidade, uf } ou null quando o CEP não existe.
// Lança erro quando a consulta falha (sem internet, ViaCEP fora do ar ou demorando).
export async function buscarEnderecoPorCep(cep) {
  const digitos = String(cep).replace(/\D/g, '')
  if (digitos.length !== 8) return null
  const controle = new AbortController()
  const timer = setTimeout(() => controle.abort(), TEMPO_LIMITE)
  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${digitos}/json/`, { signal: controle.signal })
    if (!resposta.ok) return null // 400: CEP em formato inválido
    const dados = await resposta.json()
    if (dados.erro) return null
    // CEP de cidade pequena (um CEP para a cidade toda) vem sem rua e bairro
    return { rua: dados.logradouro || '', bairro: dados.bairro || '', cidade: dados.localidade || '', uf: dados.uf || '' }
  } finally {
    clearTimeout(timer)
  }
}
