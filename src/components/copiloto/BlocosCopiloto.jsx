import { Database } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCurrency, formatDateTime, formatNumber, formatShortDate } from '../../utils/format'
import { ChartTooltip } from '../financeiro/ChartTooltip'
import { axisProps, CHART, formatCompactCurrency } from '../financeiro/chartTheme'

// Respostas do copiloto: os números vêm das consultas do backend (regras oficiais), em blocos prontos para
// desenhar. O texto do modelo só explica; o que está aqui é a fonte da verdade.

const percentual = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 })

function formatarValor(valor, formato) {
  if (valor === null || valor === undefined || valor === '') return '—'
  if (formato === 'moeda') return formatCurrency(valor)
  if (formato === 'numero') return formatNumber(valor)
  if (formato === 'percentual') return percentual.format(valor)
  return String(valor)
}

function Indicadores({ bloco }) {
  return (
    <div className="cop-indicadores">
      {bloco.titulo && <p className="cop-bloco__titulo">{bloco.titulo}</p>}
      <div className="cop-indicadores__grade">
        {bloco.itens.map((item) => (
          <div key={item.rotulo} className="cop-indicador">
            <span>{item.rotulo}</span>
            <strong className={item.formato === 'percentual' && item.valor < 0 ? 'text-danger' : undefined}>{formatarValor(item.valor, item.formato)}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

function Tabela({ bloco }) {
  const alinhaDireita = (formato) => ['moeda', 'numero', 'percentual'].includes(formato)
  return (
    <div className="cop-tabela">
      <p className="cop-bloco__titulo">{bloco.titulo}</p>
      <div className="table-wrap">
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                {bloco.colunas.map((c) => (
                  <th key={c.chave} scope="col" className={alinhaDireita(c.formato) ? 'align-right' : undefined}>
                    {c.rotulo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bloco.linhas.map((linha, i) => (
                <tr key={i}>
                  {bloco.colunas.map((c) => (
                    <td key={c.chave} className={alinhaDireita(c.formato) ? 'align-right' : undefined}>
                      {formatarValor(linha[c.chave], c.formato)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {bloco.rodape && <p className="cop-sutil">{bloco.rodape}</p>}
    </div>
  )
}

function Grafico({ bloco }) {
  const serie = bloco.series[0]
  const formatar = (v) => formatarValor(v, bloco.formato)
  const eixo = bloco.formato === 'moeda' ? formatCompactCurrency : (v) => formatNumber(v)
  if (bloco.forma === 'linha') {
    return (
      <div className="cop-grafico">
        <p className="cop-bloco__titulo">{bloco.titulo}</p>
        <div className="cop-grafico__area">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={bloco.pontos} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="cop-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART.primary} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={CHART.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={CHART.grid} />
              <XAxis dataKey="x" tickFormatter={formatShortDate} minTickGap={24} {...axisProps} />
              <YAxis tickFormatter={eixo} width={64} {...axisProps} />
              <Tooltip content={<ChartTooltip labelFormat={formatShortDate} format={formatar} />} />
              <Area type="monotone" dataKey={serie.chave} name={serie.rotulo} stroke={CHART.primary} strokeWidth={2} fill="url(#cop-area)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    )
  }
  const altura = Math.max(160, bloco.pontos.length * 34)
  return (
    <div className="cop-grafico">
      <p className="cop-bloco__titulo">{bloco.titulo}</p>
      <div style={{ height: altura }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bloco.pontos} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
            <CartesianGrid horizontal={false} stroke={CHART.grid} />
            <XAxis type="number" tickFormatter={eixo} {...axisProps} />
            <YAxis type="category" dataKey="x" width={150} {...axisProps} />
            <Tooltip cursor={{ fill: CHART.grid }} content={<ChartTooltip format={formatar} />} />
            <Bar dataKey={serie.chave} name={serie.rotulo} fill={CHART.primary} radius={[0, 3, 3, 0]} barSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function Fonte({ bloco }) {
  return (
    <details className="cop-fonte">
      <summary>
        <Database size={13} aria-hidden="true" /> Fonte: {bloco.consulta}
        {bloco.periodo && ` · ${bloco.periodo}`}
      </summary>
      <dl>
        {bloco.filtros?.length > 0 && (
          <>
            <dt>Filtros</dt>
            <dd>{bloco.filtros.join(' · ')}</dd>
          </>
        )}
        <dt>Definição</dt>
        <dd>{bloco.definicao}</dd>
        {bloco.dadosAte && (
          <>
            <dt>Dados até</dt>
            <dd>{formatDateTime(bloco.dadosAte)}</dd>
          </>
        )}
        <dt>Consultado em</dt>
        <dd>{formatDateTime(bloco.consultadoEm)}</dd>
      </dl>
    </details>
  )
}

export function BlocosCopiloto({ blocos, ultima, onPerguntar, desabilitado }) {
  return blocos.map((bloco, i) => {
    switch (bloco.tipo) {
      case 'indicadores':
        return <Indicadores key={i} bloco={bloco} />
      case 'tabela':
        return <Tabela key={i} bloco={bloco} />
      case 'grafico':
        return <Grafico key={i} bloco={bloco} />
      case 'fonte':
        return <Fonte key={i} bloco={bloco} />
      case 'link':
        return (
          <Link key={i} to={bloco.destino} className="cop-link">
            {bloco.rotulo}
          </Link>
        )
      case 'sugestoes':
        return ultima ? (
          <div key={i} className="cop-sugestoes">
            {bloco.itens.slice(0, 3).map((texto) => (
              <button key={texto} type="button" className="cop-chip" onClick={() => onPerguntar(texto)} disabled={desabilitado}>
                {texto}
              </button>
            ))}
          </div>
        ) : null
      default:
        return null
    }
  })
}

// Texto do modelo ou das regras: parágrafos e tópicos com "- " (sem markdown)
export function TextoResposta({ texto }) {
  const linhas = (texto || '').split('\n').map((l) => l.trim()).filter(Boolean)
  const grupos = []
  for (const linha of linhas) {
    const topico = linha.startsWith('- ') || linha.startsWith('• ')
    const ultimo = grupos[grupos.length - 1]
    if (topico) {
      if (ultimo?.tipo === 'lista') ultimo.itens.push(linha.slice(2))
      else grupos.push({ tipo: 'lista', itens: [linha.slice(2)] })
    } else grupos.push({ tipo: 'p', texto: linha })
  }
  return grupos.map((g, i) =>
    g.tipo === 'lista' ? (
      <ul key={i} className="cop-texto-lista">
        {g.itens.map((item, j) => (
          <li key={j}>{item}</li>
        ))}
      </ul>
    ) : (
      <p key={i}>{g.texto}</p>
    ),
  )
}
