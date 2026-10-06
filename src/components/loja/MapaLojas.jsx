import { useEffect, useMemo } from 'react'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { GRID_BRASIL } from '../../data/mapaBrasil'
import { COORDENADAS_LOJAS, LOJA_MATRIZ } from '../../data/coordenadasLojas'

// Mapa de pontos do Brasil com as lojas. Linhas animadas saem da matriz para cada unidade.
// Adaptado do componente WorldMap (dotted-map + framer-motion) para o padrão do projeto:
// o grid é pré-calculado em data/mapaBrasil.js, então nada pesado roda no navegador.

const RAIO_TERRA = 6378137
const ATRASO = 0.35 // segundos entre uma linha e a próxima
const DURACAO = 1.8 // segundos para cada linha se desenhar
const PAUSA = 2 // segundos com todas as linhas prontas antes de recomeçar

// Mesma projeção de Mercator usada para gerar o grid
function projetar({ lat, lng }) {
  const x = (RAIO_TERRA * lng * Math.PI) / 180
  const y = RAIO_TERRA * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))
  return {
    x: ((x - GRID_BRASIL.xMin) / GRID_BRASIL.xIntervalo) * GRID_BRASIL.largura,
    y: ((GRID_BRASIL.yMax - y) / GRID_BRASIL.yIntervalo) * GRID_BRASIL.altura,
  }
}

// Todos os pontos num único <path> (um elemento só no DOM em vez de ~2.600 círculos)
function caminhoDosPontos(raio) {
  const partes = []
  for (const [linha, ...trechos] of GRID_BRASIL.linhas) {
    const y = linha * GRID_BRASIL.passoY
    for (let i = 0; i < trechos.length; i += 2) {
      for (let coluna = trechos[i]; coluna <= trechos[i + 1]; coluna += 2) {
        const x = coluna / 2
        partes.push(`M${x - raio} ${y}a${raio} ${raio} 0 1 0 ${raio * 2} 0a${raio} ${raio} 0 1 0 ${-raio * 2} 0`)
      }
    }
  }
  return partes.join('')
}

// Curva entre duas lojas, sempre arqueando para cima
function curva(inicio, fim) {
  const dx = fim.x - inicio.x
  const dy = fim.y - inicio.y
  const distancia = Math.hypot(dx, dy)
  let nx = -dy / distancia
  let ny = dx / distancia
  if (ny > 0) {
    nx = -nx
    ny = -ny
  }
  const controle = {
    x: (inicio.x + fim.x) / 2 + nx * distancia * 0.42,
    y: (inicio.y + fim.y) / 2 + ny * distancia * 0.42,
  }
  return { inicio, controle, fim, d: `M${inicio.x} ${inicio.y}Q${controle.x} ${controle.y} ${fim.x} ${fim.y}` }
}

function pontoNaCurva({ inicio, controle, fim }, t) {
  const u = 1 - t
  return {
    x: u * u * inicio.x + 2 * u * t * controle.x + t * t * fim.x,
    y: u * u * inicio.y + 2 * u * t * controle.y + t * t * fim.y,
  }
}

const suave = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)

function Linha({ arco, indice, ciclo, total, tempo }) {
  const inicio = indice * ATRASO
  const fim = inicio + DURACAO
  const progresso = useTransform(tempo, (v) => {
    const t = v * ciclo
    if (t <= inicio) return 0
    if (t >= fim) return 1
    return suave((t - inicio) / DURACAO)
  })
  // Na pausa as linhas somem devagar antes de recomeçar
  const opacidadeLinha = useTransform(tempo, (v) => {
    const t = v * ciclo
    return t <= total ? 1 : 1 - (t - total) / PAUSA
  })
  const opacidadePonto = useTransform(tempo, (v) => {
    const t = v * ciclo
    if (t <= inicio || t >= fim + 0.4) return 0
    return t <= fim ? 1 : 1 - (t - fim) / 0.4
  })
  const x = useTransform(progresso, (p) => pontoNaCurva(arco, p).x)
  const y = useTransform(progresso, (p) => pontoNaCurva(arco, p).y)

  return (
    <g>
      <motion.path className="mapa-lojas__linha" d={arco.d} style={{ pathLength: progresso, opacity: opacidadeLinha }} />
      <motion.circle className="mapa-lojas__viajante" r="0.55" cx={x} cy={y} style={{ opacity: opacidadePonto }} />
    </g>
  )
}

export function MapaLojas({ lojas, ativa, onAtivar }) {
  const reduzirMovimento = useReducedMotion()
  const tempo = useMotionValue(0)
  const pontos = useMemo(() => caminhoDosPontos(0.24), [])

  const noMapa = useMemo(
    () =>
      lojas
        .filter((loja) => COORDENADAS_LOJAS[loja.nome])
        .map((loja) => ({ ...loja, ...COORDENADAS_LOJAS[loja.nome], posicao: projetar(COORDENADAS_LOJAS[loja.nome]) })),
    [lojas],
  )
  const matriz = noMapa.find((loja) => loja.nome === LOJA_MATRIZ)
  const arcos = useMemo(
    () => (matriz ? noMapa.filter((loja) => loja !== matriz).map((loja) => curva(matriz.posicao, loja.posicao)) : []),
    [noMapa, matriz],
  )

  const total = Math.max(arcos.length - 1, 0) * ATRASO + DURACAO
  const ciclo = total + PAUSA

  useEffect(() => {
    if (reduzirMovimento || !arcos.length) return undefined
    const controle = animate(tempo, [0, 1], { duration: ciclo, ease: 'linear', repeat: Infinity })
    return () => controle.stop()
  }, [tempo, ciclo, arcos.length, reduzirMovimento])

  const descricao = `Mapa do Brasil com as lojas Casa Lorenzi: ${noMapa.map((l) => `${l.nome} (${l.cidade})`).join(', ')}`

  return (
    <div className="mapa-lojas">
      <svg viewBox={`-1 -1 ${GRID_BRASIL.largura + 2} ${GRID_BRASIL.altura + 2}`} role="img" aria-label={descricao}>
        <path className="mapa-lojas__pontos" d={pontos} />

        {arcos.map((arco, indice) =>
          reduzirMovimento ? (
            <path key={indice} className="mapa-lojas__linha" d={arco.d} />
          ) : (
            <Linha key={indice} arco={arco} indice={indice} ciclo={ciclo} total={total} tempo={tempo} />
          ),
        )}

        {noMapa.map((loja) => {
          const direita = loja.lado !== 'esquerda'
          return (
            <g
              key={loja.id}
              className={`mapa-lojas__loja${ativa === loja.id ? ' is-ativa' : ''}${ativa && ativa !== loja.id ? ' is-apagada' : ''}`}
              transform={`translate(${loja.posicao.x} ${loja.posicao.y})`}
              onMouseEnter={() => onAtivar?.(loja.id)}
              onMouseLeave={() => onAtivar?.(null)}
            >
              <circle className="mapa-lojas__onda" r="0.9" />
              <circle className="mapa-lojas__ponto" r="0.9" />
              <text x={direita ? 1.9 : -1.9} textAnchor={direita ? 'start' : 'end'} dominantBaseline="central">
                {loja.nome}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
