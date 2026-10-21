import { Check, ChevronDown } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Children, Fragment, isValidElement, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { animacaoDaOpcao, animacaoDoMenu } from './animacaoMenu'

// Seletor no lugar do <select> nativo, com o menu animado do AnimatedDropdown (emerald-ui, MIT)
// adaptado ao padrão do projeto: JSX, CSS próprio com a paleta do site e motion (o novo nome do
// framer-motion), sem Tailwind. A API é a do <select>: value, onChange(e) com e.target.value,
// disabled, required, className (o botão fica com a aparência do select que substitui) e as opções
// como <option> filhas. Teclado e leitor de tela seguem o padrão "combobox só de seleção" da W3C.
//
// O menu abre por cima da página (position: fixed), para não ser cortado por modais e tabelas com
// rolagem; dentro de um <dialog> aberto com showModal(), abre no próprio dialog, que fica numa
// camada acima do resto da página.

const BUSCA_MS = 500 // letras digitadas em sequência procuram uma opção pelo começo do nome

function texto(no) {
  if (no == null || typeof no === 'boolean') return ''
  if (typeof no === 'string' || typeof no === 'number') return String(no)
  if (Array.isArray(no)) return no.map(texto).join('')
  return isValidElement(no) ? texto(no.props.children) : ''
}

function lerOpcoes(children, opcoes = []) {
  Children.forEach(children, (filho) => {
    if (!isValidElement(filho)) return
    if (filho.type === Fragment) {
      lerOpcoes(filho.props.children, opcoes)
      return
    }
    if (filho.type === 'option') {
      const rotulo = texto(filho.props.children)
      // Como no <option>: sem value, o valor é o texto
      opcoes.push({ value: String(filho.props.value ?? rotulo), rotulo, disabled: Boolean(filho.props.disabled) })
    }
  })
  return opcoes
}

const semAcento = (valor) => valor.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

export function Select({ value, onChange, children, className = '', disabled = false, required = false, id, name, ...rest }) {
  const opcoes = lerOpcoes(children)
  const valor = value == null ? '' : String(value)
  const indiceEscolhido = opcoes.findIndex((o) => o.value === valor)
  // Como no <select>: um valor que não está entre as opções mostra a primeira
  const escolhida = opcoes[indiceEscolhido] ?? opcoes[0]
  const habilitadas = opcoes.flatMap((o, i) => (o.disabled ? [] : [i]))

  const [aberto, setAberto] = useState(false)
  const [ativo, setAtivo] = useState(-1) // opção destacada pelo teclado ou pelo mouse
  const [lugar, setLugar] = useState(null) // posição do menu na tela
  const [alvo, setAlvo] = useState(null) // onde o menu é desenhado (o body ou o dialog aberto)
  const [nome, setNome] = useState() // nome acessível, do <label> do campo
  const botaoRef = useRef(null)
  const menuRef = useRef(null)
  const busca = useRef({ texto: '', ate: 0 })
  const listaId = useId()
  const reduzir = useReducedMotion()

  const abrir = (destaque = indiceEscolhido) => {
    if (disabled) return
    setAlvo(botaoRef.current.closest('dialog[open]') ?? document.body)
    setAtivo(opcoes[destaque] && !opcoes[destaque].disabled ? destaque : (habilitadas[0] ?? -1))
    setLugar(null)
    setAberto(true)
  }
  const fechar = () => setAberto(false)

  const escolher = (indice) => {
    const opcao = opcoes[indice]
    if (!opcao || opcao.disabled) return
    fechar()
    if (opcao.value !== valor) onChange?.({ target: { value: opcao.value, name }, currentTarget: { value: opcao.value, name } })
  }

  const mover = (passo) => {
    if (!habilitadas.length) return
    const atual = habilitadas.indexOf(ativo)
    const proxima = atual < 0 ? (passo > 0 ? 0 : habilitadas.length - 1) : atual + passo
    setAtivo(habilitadas[Math.min(habilitadas.length - 1, Math.max(0, proxima))])
  }

  // Letras digitadas em sequência procuram a opção pelo começo do nome; a mesma letra repetida passa
  // para a próxima opção com essa letra (como no <select>)
  const procurar = (letra) => {
    const agora = Date.now()
    const anterior = agora < busca.current.ate ? busca.current.texto : ''
    const termo = semAcento(anterior + letra)
    busca.current = { texto: anterior + letra, ate: agora + BUSCA_MS }
    const repetida = termo.length > 1 && [...termo].every((c) => c === termo[0])
    const procurado = repetida ? termo[0] : termo
    const inicio = repetida ? habilitadas.indexOf(ativo) + 1 : 0
    const ordem = [...habilitadas.slice(inicio), ...habilitadas.slice(0, inicio)]
    return ordem.find((i) => semAcento(opcoes[i].rotulo).startsWith(procurado)) ?? -1
  }

  const aoTeclar = (e) => {
    const { key: tecla } = e
    const letra = tecla.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey
    if (!aberto) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(tecla)) {
        e.preventDefault()
        abrir()
      } else if (tecla === 'Home' || tecla === 'End') {
        e.preventDefault()
        abrir(tecla === 'Home' ? habilitadas[0] : habilitadas.at(-1))
      } else if (letra) {
        const encontrada = procurar(tecla)
        if (encontrada >= 0) abrir(encontrada)
      }
      return
    }
    if (tecla === 'ArrowDown' || tecla === 'ArrowUp') {
      e.preventDefault()
      mover(tecla === 'ArrowDown' ? 1 : -1)
    } else if (tecla === 'Home' || tecla === 'End') {
      e.preventDefault()
      setAtivo((tecla === 'Home' ? habilitadas[0] : habilitadas.at(-1)) ?? -1)
    } else if (tecla === 'Enter' || (tecla === ' ' && Date.now() >= busca.current.ate)) {
      e.preventDefault()
      escolher(ativo)
    } else if (tecla === 'Escape') {
      // Fecha só o menu: sem isso, o Esc também fecharia o modal (<dialog>) em volta
      e.preventDefault()
      e.stopPropagation()
      fechar()
    } else if (tecla === 'Tab') {
      fechar()
    } else if (letra) {
      e.preventDefault()
      const encontrada = procurar(tecla)
      if (encontrada >= 0) setAtivo(encontrada)
    }
  }

  // Nome para leitor de tela: o texto do <label> sem o próprio botão (senão "Tamanho" viraria
  // "Tamanho Selecione o tamanho"); o valor escolhido é anunciado à parte, pelo conteúdo do botão
  useLayoutEffect(() => {
    const rotulo = botaoRef.current?.labels?.[0]
    if (!rotulo) return
    const copia = rotulo.cloneNode(true)
    copia.querySelectorAll('[role="combobox"], .seletor__validacao').forEach((elemento) => elemento.remove())
    setNome(copia.textContent.trim() || undefined)
  }, [])

  // Posição do menu: abaixo do botão, com a mesma largura; para cima quando falta espaço embaixo
  useLayoutEffect(() => {
    if (!aberto) return undefined
    const posicionar = () => {
      const botao = botaoRef.current
      if (!botao) return
      const r = botao.getBoundingClientRect()
      const abaixo = window.innerHeight - r.bottom
      const alturaMenu = menuRef.current?.scrollHeight ?? 0
      const paraCima = abaixo < Math.min(alturaMenu, 280) + 16 && r.top > abaixo
      const estilo = getComputedStyle(botao)
      setLugar({
        left: Math.max(8, Math.min(r.left, window.innerWidth - r.width - 8)),
        minWidth: r.width,
        top: paraCima ? undefined : r.bottom + 6,
        bottom: paraCima ? window.innerHeight - r.top + 6 : undefined,
        maxHeight: Math.max(160, Math.min(320, (paraCima ? r.top : abaixo) - 16)),
        fontFamily: estilo.fontFamily,
        fontSize: estilo.fontSize,
        paraCima,
      })
    }
    posicionar()
    window.addEventListener('resize', posicionar)
    window.addEventListener('scroll', posicionar, true)
    return () => {
      window.removeEventListener('resize', posicionar)
      window.removeEventListener('scroll', posicionar, true)
    }
  }, [aberto])

  // Clique fora fecha
  useEffect(() => {
    if (!aberto) return undefined
    const fora = (e) => {
      if (!botaoRef.current?.contains(e.target) && !menuRef.current?.contains(e.target)) fechar()
    }
    document.addEventListener('mousedown', fora)
    return () => document.removeEventListener('mousedown', fora)
  }, [aberto])

  // A opção destacada fica sempre visível na lista. Rola só o menu (scrollIntoView rolaria também a
  // página) e de novo quando o menu ganha a altura máxima, depois de posicionado.
  const alturaMaxima = lugar?.maxHeight
  useEffect(() => {
    const menu = menuRef.current
    const opcao = menu?.querySelector('[data-ativo="true"]')
    if (!aberto || !opcao) return
    if (opcao.offsetTop < menu.scrollTop) menu.scrollTop = opcao.offsetTop
    else if (opcao.offsetTop + opcao.offsetHeight > menu.scrollTop + menu.clientHeight) {
      menu.scrollTop = opcao.offsetTop + opcao.offsetHeight - menu.clientHeight
    }
  }, [aberto, ativo, alturaMaxima])

  const animacao = animacaoDoMenu(reduzir, lugar?.paraCima)

  return (
    <>
      <button
        ref={botaoRef}
        type="button"
        role="combobox"
        id={id}
        className={`${className} seletor__gatilho`.trim()}
        aria-label={nome}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-controls={listaId}
        aria-activedescendant={aberto && ativo >= 0 ? `${listaId}-${ativo}` : undefined}
        aria-required={required || undefined}
        disabled={disabled}
        onClick={() => (aberto ? fechar() : abrir())}
        onKeyDown={aoTeclar}
        onBlur={fechar}
        {...rest}
      >
        <span className="seletor__valor">{escolhida?.rotulo}</span>
        <motion.span
          className="seletor__seta"
          aria-hidden="true"
          animate={{ rotate: aberto ? 180 : 0 }}
          transition={{ duration: reduzir ? 0 : 0.2, ease: 'easeInOut' }}
        >
          <ChevronDown size={16} />
        </motion.span>
      </button>

      {/* Validação do formulário (required) como no <select>: o navegador não envia vazio */}
      {required && (
        <input
          className="seletor__validacao"
          tabIndex={-1}
          aria-hidden="true"
          required
          disabled={disabled}
          value={valor}
          onChange={() => {}}
          onFocus={() => botaoRef.current?.focus()}
        />
      )}

      {alvo &&
        createPortal(
          <AnimatePresence>
            {aberto && (
              <motion.ul
                key="menu"
                ref={menuRef}
                id={listaId}
                role="listbox"
                aria-label={rest['aria-label'] ?? nome}
                className="seletor__menu"
                {...animacao}
                style={{ ...animacao.style, ...(lugar ?? { visibility: 'hidden' }) }}
                // O foco fica no botão (as opções são escolhidas pelo aria-activedescendant)
                onMouseDown={(e) => e.preventDefault()}
              >
                {opcoes.map((opcao, i) => (
                  <motion.li
                    key={`${opcao.value}-${i}`}
                    id={`${listaId}-${i}`}
                    role="option"
                    className="seletor__opcao"
                    aria-selected={i === indiceEscolhido}
                    aria-disabled={opcao.disabled || undefined}
                    data-ativo={i === ativo}
                    {...animacaoDaOpcao(reduzir, i)}
                    onMouseMove={() => !opcao.disabled && ativo !== i && setAtivo(i)}
                    onClick={() => escolher(i)}
                  >
                    <span>{opcao.rotulo}</span>
                    {i === indiceEscolhido && <Check size={14} aria-hidden="true" />}
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>,
          alvo,
        )}
    </>
  )
}
