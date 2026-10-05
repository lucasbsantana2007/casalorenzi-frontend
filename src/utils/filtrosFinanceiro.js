import { daysAgoInput, formatDate, todayInput, toInputDate } from './format'

// Filtros do painel financeiro. Ficam na URL (?periodo=30d&lojas=1,3…) para o
// administrador salvar ou compartilhar uma visão, como um marcador no Power BI.

export const PERIODOS = [
  { value: 'hoje', label: 'Hoje' },
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
  { value: 'mes', label: 'Este mês' },
  { value: 'mes-anterior', label: 'Mês anterior' },
  { value: 'trimestre', label: 'Este trimestre' },
  { value: 'ano', label: 'Este ano' },
  { value: 'custom', label: 'Personalizado' },
]

export const COMPARACOES = [
  { value: 'anterior', label: 'Período anterior' },
  { value: 'ano', label: 'Mesmo período do ano passado' },
  { value: 'nenhum', label: 'Sem comparação' },
]

export const AGRUPAMENTOS = [
  { value: 'dia', label: 'Dia' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mês' },
]

export const CANAIS = [
  { value: 'Loja física', label: 'Loja física' },
  { value: 'E-commerce', label: 'E-commerce' },
]

export const GENEROS = [
  { value: 'Feminino', label: 'Feminino' },
  { value: 'Masculino', label: 'Masculino' },
]

export const FILTROS_PADRAO = { periodo: '30d', de: '', ate: '', comparar: 'anterior', agrupar: 'dia', lojas: [], canais: [], categorias: [], generos: [] }

const LISTAS = ['lojas', 'canais', 'categorias', 'generos']

export function lerFiltros(searchParams) {
  const filtros = { ...FILTROS_PADRAO }
  Object.keys(FILTROS_PADRAO).forEach((key) => {
    const valor = searchParams.get(key)
    if (valor === null) return
    filtros[key] = LISTAS.includes(key) ? valor.split(',').filter(Boolean) : valor
  })
  return filtros
}

// Só grava na URL o que difere do padrão, para a URL ficar curta
export function gravarFiltros(filtros) {
  const params = {}
  Object.entries(filtros).forEach(([key, valor]) => {
    const padrao = FILTROS_PADRAO[key]
    if (LISTAS.includes(key)) {
      if (valor.length) params[key] = valor.join(',')
    } else if (valor && valor !== padrao) {
      params[key] = valor
    }
  })
  return params
}

// Converte o período escolhido em datas yyyy-mm-dd (inclusive)
export function resolverPeriodo({ periodo, de, ate }) {
  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = hoje.getMonth()
  switch (periodo) {
    case 'hoje':
      return { de: todayInput(), ate: todayInput() }
    case '7d':
      return { de: daysAgoInput(6), ate: todayInput() }
    case '90d':
      return { de: daysAgoInput(89), ate: todayInput() }
    case 'mes':
      return { de: toInputDate(new Date(ano, mes, 1)), ate: todayInput() }
    case 'mes-anterior':
      return { de: toInputDate(new Date(ano, mes - 1, 1)), ate: toInputDate(new Date(ano, mes, 0)) }
    case 'trimestre':
      return { de: toInputDate(new Date(ano, mes - (mes % 3), 1)), ate: todayInput() }
    case 'ano':
      return { de: toInputDate(new Date(ano, 0, 1)), ate: todayInput() }
    case 'custom':
      return { de: de || daysAgoInput(29), ate: ate || todayInput() }
    default:
      return { de: daysAgoInput(29), ate: todayInput() }
  }
}

// Parâmetros enviados ao serviço (mock ou GET /financeiro/resumo)
export function paramsDaApi(filtros) {
  const { de, ate } = resolverPeriodo(filtros)
  return {
    de,
    ate,
    comparar: filtros.comparar,
    agrupar: filtros.agrupar,
    lojas: filtros.lojas.join(','),
    canais: filtros.canais.join(','),
    categorias: filtros.categorias.join(','),
    generos: filtros.generos.join(','),
  }
}

export function descreverPeriodo(filtros) {
  const { de, ate } = resolverPeriodo(filtros)
  const rotulo = PERIODOS.find((p) => p.value === filtros.periodo)?.label
  const datas = de === ate ? formatDate(`${de}T00:00`) : `${formatDate(`${de}T00:00`)} a ${formatDate(`${ate}T00:00`)}`
  return filtros.periodo === 'custom' ? datas : `${rotulo} · ${datas}`
}

export function descreverComparacao(comparar) {
  if (comparar === 'ano') return 'vs. mesmo período do ano passado'
  if (comparar === 'anterior') return 'vs. período anterior'
  return null
}
