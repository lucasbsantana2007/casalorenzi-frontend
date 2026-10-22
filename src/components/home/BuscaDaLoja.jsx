import { Search, X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useId, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { imagemDoProduto } from '../../data/imagensProdutos'
import { caminhoDoProduto } from '../../data/marcas'
import { useMarca } from '../../hooks/useMarca'
import { useVitrine } from '../../hooks/useVitrine'
import { formatCurrency } from '../../utils/format'

const MINIMO_LETRAS = 2
const MAXIMO_RESULTADOS = 8
const LARGURA_ABERTA = 240 // cabe ao lado da conta e da sacola sem tirar o menu do centro

const semAcento = (texto) =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

// Todas as palavras digitadas no nome ou na categoria ("tricô" acha o cardigã), sem ligar para acentos.
// Quem tem a palavra no nome vem antes, e quanto mais cedo ela aparece, melhor.
function procurar(produtos, busca) {
  const termos = semAcento(busca).split(/\s+/).filter(Boolean)
  const posicao = (nome) => (nome.includes(termos[0]) ? nome.indexOf(termos[0]) : Infinity)
  return produtos
    .map((p) => ({ produto: p, nome: semAcento(p.nome), texto: semAcento(`${p.nome} ${p.categoria}`) }))
    .filter(({ texto }) => termos.every((t) => texto.includes(t)))
    .sort((a, b) => posicao(a.nome) - posicao(b.nome) || a.nome.localeCompare(b.nome))
    .slice(0, MAXIMO_RESULTADOS)
    .map(({ produto }) => produto)
}

// Busca do cabeçalho: o ExpandingSearchDock (shadcn) adaptado à loja. A lupa vira um campo sublinhado que
// cresce para a esquerda, e as peças aparecem embaixo enquanto a pessoa digita (setas escolhem, Enter abre,
// Esc fecha). Em telas menores o campo abre logo abaixo do cabeçalho.
export function BuscaDaLoja() {
  const [aberta, setAberta] = useState(false)
  const [busca, setBusca] = useState('')
  const [ativo, setAtivo] = useState(0)
  const produtos = useVitrine(useMarca().id)
  const navigate = useNavigate()
  const location = useLocation()
  const reduzir = useReducedMotion()
  const ref = useRef(null)
  const focarLupa = useRef(false)
  const listaId = useId()

  const procurando = busca.trim().length >= MINIMO_LETRAS
  const achados = procurando ? procurar(produtos, busca.trim()) : []
  const indice = Math.min(ativo, achados.length - 1)

  const fechar = (devolverFoco = false) => {
    focarLupa.current = devolverFoco
    setAberta(false)
    setBusca('')
    setAtivo(0)
  }

  // Abrir uma peça (ou qualquer troca de página) fecha a busca
  const [rota, setRota] = useState(location.key)
  if (rota !== location.key) {
    setRota(location.key)
    setAberta(false)
    setBusca('')
    setAtivo(0)
  }

  useEffect(() => {
    if (!aberta) return undefined
    const fora = (e) => {
      if (!ref.current?.contains(e.target)) fechar()
    }
    document.addEventListener('mousedown', fora)
    return () => document.removeEventListener('mousedown', fora)
  }, [aberta])

  const abrirPeca = (produto) => produto && navigate(caminhoDoProduto(produto))

  const aoTeclar = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      fechar(true)
    } else if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && achados.length) {
      e.preventDefault()
      const passo = e.key === 'ArrowDown' ? 1 : -1
      setAtivo((indice + passo + achados.length) % achados.length)
    }
  }

  return (
    <div className="busca" ref={ref}>
      <AnimatePresence mode="wait" initial={false}>
        {!aberta ? (
          <motion.button
            key="lupa"
            ref={(botao) => {
              if (botao && focarLupa.current) {
                focarLupa.current = false
                botao.focus()
              }
            }}
            type="button"
            className="store-header__icon busca__lupa"
            aria-label="Buscar peças"
            title="Buscar peças"
            onClick={() => setAberta(true)}
            initial={reduzir ? false : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={reduzir ? { opacity: 0 } : { scale: 0, opacity: 0 }}
            transition={{ duration: reduzir ? 0 : 0.15 }}
          >
            <Search size={20} strokeWidth={1.5} aria-hidden="true" />
          </motion.button>
        ) : (
          <motion.form
            key="campo"
            role="search"
            className="busca__form"
            onSubmit={(e) => {
              e.preventDefault()
              abrirPeca(achados[indice])
            }}
            initial={reduzir ? { opacity: 0 } : { width: 40, opacity: 0 }}
            animate={{ width: LARGURA_ABERTA, opacity: 1 }}
            exit={reduzir ? { opacity: 0 } : { width: 40, opacity: 0 }}
            transition={reduzir ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 30 }}
          >
            <Search size={16} strokeWidth={1.5} className="busca__icone" aria-hidden="true" />
            <input
              type="text"
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value)
                setAtivo(0)
              }}
              onKeyDown={aoTeclar}
              placeholder="Buscar peças"
              aria-label="Buscar peças pelo nome"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={procurando && achados.length > 0}
              aria-controls={listaId}
              aria-activedescendant={procurando && achados.length ? `${listaId}-${indice}` : undefined}
              autoComplete="off"
              spellCheck={false}
              autoFocus
            />
            <motion.button
              type="button"
              className="busca__fechar"
              aria-label="Fechar busca"
              onClick={() => fechar(true)}
              initial={reduzir ? false : { scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={reduzir ? undefined : { scale: 1.1 }}
              whileTap={reduzir ? undefined : { scale: 0.9 }}
            >
              <X size={16} strokeWidth={1.5} aria-hidden="true" />
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {aberta && procurando && (
          <motion.div
            key="resultados"
            className="busca__resultados"
            initial={{ opacity: 0, y: reduzir ? 0 : -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduzir ? 0 : 0.18, ease: 'easeOut' }}
          >
            {achados.length > 0 ? (
              <ul id={listaId} role="listbox" aria-label="Peças encontradas">
                {achados.map((p, i) => (
                  <li
                    key={p.id}
                    id={`${listaId}-${i}`}
                    role="option"
                    aria-selected={i === indice}
                    className="busca__item"
                    onMouseMove={() => setAtivo(i)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => abrirPeca(p)}
                  >
                    <img src={imagemDoProduto(p)} alt="" loading="lazy" />
                    <span className="busca__texto">
                      <strong>{p.nome}</strong>
                      <span>
                        {p.genero} · {p.categoria}
                      </span>
                    </span>
                    <span className="busca__preco">{formatCurrency(p.precoBase)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="busca__vazio">Nenhuma peça encontrada para “{busca.trim()}”.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <span className="sr-only" role="status">
        {aberta && procurando ? `${achados.length} ${achados.length === 1 ? 'peça encontrada' : 'peças encontradas'}` : ''}
      </span>
    </div>
  )
}
