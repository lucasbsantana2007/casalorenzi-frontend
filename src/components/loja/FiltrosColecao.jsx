import { Check, ChevronDown } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useId, useRef, useState } from 'react'
import { formatNumber } from '../../utils/format'
import { animacaoDaOpcao, animacaoDoMenu } from '../ui/animacaoMenu'
import { Slider } from '../ui/Slider'

const ORDEM_TAMANHOS = ['PP', 'P', 'M', 'G', 'GG', 'XG']
const PASSO_PRECO = 10

// disponivel desconta as peças reservadas por pedidos ainda não enviados (mocks: só estoqueTotal)
const livre = (v) => v.disponivel ?? v.estoqueTotal
const preco = (valor) => `R$ ${formatNumber(valor)}`
const alternar = (lista, item) => (lista.includes(item) ? lista.filter((x) => x !== item) : [...lista, item])

// Letras na ordem de vestir, depois os números (calças, cintos) e por fim o resto (Único)
function ordenarTamanhos(tamanhos) {
  const peso = (t) => {
    const i = ORDEM_TAMANHOS.indexOf(t)
    if (i !== -1) return [0, i]
    return Number.isNaN(Number(t)) ? [2, 0] : [1, Number(t)]
  }
  return [...tamanhos].sort((a, b) => {
    const [grupoA, valorA] = peso(a)
    const [grupoB, valorB] = peso(b)
    return grupoA - grupoB || valorA - valorB || a.localeCompare(b, 'pt-BR')
  })
}

// Filtros da coleção num menu como o dos seletores: uma categoria por vez; com ela escolhida, os tamanhos
// disponíveis daquela categoria; e a faixa de preço. `produtos` já vem só do gênero da página.
export function FiltrosColecao({ produtos, filtros, onChange, onLimpar, total }) {
  const [aberto, setAberto] = useState(false)
  const ref = useRef(null)
  const botaoRef = useRef(null)
  const menuId = useId()
  const reduzir = useReducedMotion()
  const { categoria, tamanhos, faixa } = filtros

  useEffect(() => {
    if (!aberto) return undefined
    const fora = (e) => {
      if (!ref.current?.contains(e.target)) setAberto(false)
    }
    const tecla = (e) => {
      if (e.key !== 'Escape') return
      setAberto(false)
      botaoRef.current?.focus()
    }
    document.addEventListener('mousedown', fora)
    document.addEventListener('keydown', tecla)
    return () => {
      document.removeEventListener('mousedown', fora)
      document.removeEventListener('keydown', tecla)
    }
  }, [aberto])

  const categorias = [...new Set(produtos.map((p) => p.categoria))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
  const daCategoria = produtos.filter((p) => p.categoria === categoria)
  const opcoesTamanho = ordenarTamanhos(new Set(daCategoria.flatMap((p) => p.variacoes.filter((v) => livre(v) > 0).map((v) => v.tamanho))))
  const precos = produtos.map((p) => p.precoBase)
  const limites = precos.length
    ? [Math.floor(Math.min(...precos) / PASSO_PRECO) * PASSO_PRECO, Math.ceil(Math.max(...precos) / PASSO_PRECO) * PASSO_PRECO]
    : [0, 0]
  const [de, ate] = faixa ?? limites
  const ativos = (categoria ? 1 : 0) + tamanhos.length + (faixa ? 1 : 0)

  // Trocar de categoria limpa os tamanhos, que são de cada categoria
  const escolherCategoria = (nova) => onChange({ ...filtros, categoria: nova, tamanhos: [] })
  // Voltar à faixa inteira tira o filtro de preço
  const mudarFaixa = ([novoDe, novoAte]) =>
    onChange({ ...filtros, faixa: novoDe === limites[0] && novoAte === limites[1] ? null : [novoDe, novoAte] })

  return (
    <div className="colecao-filtros" ref={ref}>
      <button
        ref={botaoRef}
        type="button"
        className="store-filter-btn colecao-filtros__gatilho"
        aria-expanded={aberto}
        aria-controls={menuId}
        onClick={() => setAberto((v) => !v)}
      >
        Filtros{ativos > 0 && ` (${ativos})`}
        <motion.span
          className="colecao-filtros__seta"
          aria-hidden="true"
          animate={{ rotate: aberto ? 180 : 0 }}
          transition={{ duration: reduzir ? 0 : 0.2, ease: 'easeInOut' }}
        >
          <ChevronDown size={16} strokeWidth={1.5} />
        </motion.span>
      </button>

      <AnimatePresence>
        {aberto && (
          <motion.div key="menu" id={menuId} className="colecao-filtros__menu" role="group" aria-label="Filtros" {...animacaoDoMenu(reduzir)}>
            <fieldset className="colecao-filtros__grupo">
              <legend>Categoria</legend>
              <ul className="colecao-filtros__categorias">
                {[null, ...categorias].map((c, i) => (
                  <motion.li key={c ?? 'todas'} {...animacaoDaOpcao(reduzir, i)}>
                    <button type="button" className="colecao-filtros__categoria" aria-pressed={c === categoria} onClick={() => escolherCategoria(c)}>
                      {c ?? 'Todas'}
                      {c === categoria && <Check size={14} aria-hidden="true" />}
                    </button>
                  </motion.li>
                ))}
              </ul>
            </fieldset>

            <AnimatePresence initial={false}>
              {categoria && opcoesTamanho.length > 0 && (
                <motion.fieldset
                  key="tamanhos"
                  className="colecao-filtros__grupo"
                  initial={reduzir ? { opacity: 0 } : { opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  transition={{ duration: reduzir ? 0 : 0.2, ease: 'easeOut' }}
                >
                  <legend>Tamanho</legend>
                  <div className="colecao-filtros__tamanhos">
                    {opcoesTamanho.map((t) => (
                      <button
                        key={t}
                        type="button"
                        aria-pressed={tamanhos.includes(t)}
                        onClick={() => onChange({ ...filtros, tamanhos: alternar(tamanhos, t) })}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </motion.fieldset>
              )}
            </AnimatePresence>

            {limites[1] > limites[0] && (
              <fieldset className="colecao-filtros__grupo">
                <legend>Preço</legend>
                <p className="colecao-filtros__faixa">
                  {preco(de)} – {preco(ate)}
                </p>
                <Slider
                  min={limites[0]}
                  max={limites[1]}
                  step={PASSO_PRECO}
                  minStepsBetweenThumbs={1}
                  value={[de, ate]}
                  onValueChange={mudarFaixa}
                  showTooltip
                  tooltipContent={preco}
                  thumbLabels={['Preço mínimo', 'Preço máximo']}
                />
              </fieldset>
            )}

            <div className="colecao-filtros__rodape">
              <span role="status">
                {total} {total === 1 ? 'peça' : 'peças'}
              </span>
              {ativos > 0 && (
                <button type="button" onClick={onLimpar}>
                  Limpar filtros
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
