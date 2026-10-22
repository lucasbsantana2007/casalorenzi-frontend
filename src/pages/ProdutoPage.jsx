import { Minus, Plus } from 'lucide-react'
import { useId, useLayoutEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { AsyncContent } from '../components/ui/AsyncContent'
import { Select } from '../components/ui/Select'
import { fotosDoProduto } from '../data/imagensProdutos'
import { caminhoDoProduto, inicioDaMarca, marcaDoProduto } from '../data/marcas'
import { useMarca } from '../hooks/useMarca'
import { useAsync } from '../hooks/useAsync'
import { useSacola } from '../hooks/useSacola'
import { produtosService } from '../services/produtosService'
import { formatCurrency } from '../utils/format'
import { NotFoundPage } from './NotFoundPage'

const unicos = (lista) => [...new Set(lista)]

function Secao({ titulo, children, abertaInicial = false }) {
  const [aberta, setAberta] = useState(abertaInicial)
  const corpoId = useId()
  return (
    <div className="pdp-section">
      <button
        type="button"
        className="pdp-section__toggle"
        aria-expanded={aberta}
        aria-controls={corpoId}
        onClick={() => setAberta((v) => !v)}
      >
        {titulo}
        {aberta ? <Minus size={14} aria-hidden="true" /> : <Plus size={14} aria-hidden="true" />}
      </button>
      {/* Fechada continua na página (hidden): useReservarSecoesAbertas mede a altura de todas abertas */}
      <div id={corpoId} className="pdp-section__body" hidden={!aberta}>
        {children}
      </div>
    </div>
  )
}

// A foto ao lado é sticky e, perto do fim da página, acompanha o fim da coluna de informações: se abrir
// uma seção mudasse a altura da coluna, a foto pularia junto. Por isso as seções reservam a altura de
// todas abertas (--pdp-secoes-abertas, usada no layout de duas colunas). A altura é medida numa cópia
// invisível, com a mesma largura, e refeita quando a largura muda ou as fontes terminam de carregar.
function useReservarSecoesAbertas(ref, conteudo) {
  useLayoutEffect(() => {
    const secoes = ref.current
    if (!secoes) return undefined
    const medir = () => {
      if (!secoes.isConnected) return // as fontes podem terminar de carregar depois de sair da página
      const copia = secoes.cloneNode(true)
      copia.removeAttribute('style')
      copia.setAttribute('aria-hidden', 'true')
      copia.querySelectorAll('[hidden]').forEach((corpo) => corpo.removeAttribute('hidden'))
      copia.querySelectorAll('[id]').forEach((elemento) => elemento.removeAttribute('id'))
      Object.assign(copia.style, {
        position: 'absolute',
        visibility: 'hidden',
        pointerEvents: 'none',
        width: `${secoes.offsetWidth}px`,
        minHeight: '0',
      })
      secoes.parentNode.appendChild(copia)
      // Para cima: a altura tem frações de pixel, e arredondar para baixo deixaria a coluna crescer 1 px
      secoes.style.setProperty('--pdp-secoes-abertas', `${Math.ceil(copia.getBoundingClientRect().height)}px`)
      copia.remove()
    }
    medir()
    let largura = secoes.offsetWidth
    const observador = new ResizeObserver(() => {
      if (secoes.offsetWidth !== largura) {
        largura = secoes.offsetWidth
        medir()
      }
    })
    observador.observe(secoes)
    document.fonts?.ready.then(medir)
    return () => observador.disconnect()
  }, [ref, conteudo])
}

// Foto da peça; com mais de uma (Vulto: frente, costas e no corpo), miniaturas para trocar
function GaleriaDaPeca({ fotos, nome }) {
  const [atual, setAtual] = useState(0)
  const foto = fotos[atual] ?? fotos[0]
  const vertical = foto.vista === 'No corpo'
  return (
    <div className="pdp__media">
      <img src={foto.url} alt={`${nome}, ${foto.vista.toLowerCase()}`} className={vertical ? 'pdp__foto-modelo' : undefined} />
      {fotos.length > 1 && (
        <div className="pdp__vistas" role="group" aria-label="Fotos da peça">
          {fotos.map(({ url, vista }, i) => (
            <button key={url} type="button" className={i === atual ? 'is-ativa' : undefined} aria-pressed={i === atual} onClick={() => setAtual(i)}>
              <img src={url} alt="" />
              <span className="sr-only">{vista}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function ProdutoPage() {
  const { id } = useParams()
  const state = useAsync(() => produtosService.obter(id), [id])
  const marca = useMarca()

  if (state.error?.status === 404) return <NotFoundPage homePath={inicioDaMarca(marca)} />

  return (
    <AsyncContent state={state} isEmpty={() => false}>
      {(produto) => {
        if (!produto.ativo) return <NotFoundPage homePath={inicioDaMarca(marca)} />
        // A peça abre na vitrine da marca dela (link antigo /produto/:id de uma peça da Vulto → /vulto/produto/:id)
        if (marcaDoProduto(produto).id !== marca.id) return <Navigate to={caminhoDoProduto(produto)} replace />
        return <Produto produto={produto} />
      }}
    </AsyncContent>
  )
}

function Produto({ produto }) {
  const { adicionar } = useSacola()
  const cores = unicos(produto.variacoes.map((v) => v.cor))
  const [cor, setCor] = useState(cores[0])
  const [tamanho, setTamanho] = useState('')
  const [copiado, setCopiado] = useState(false)
  const secoesRef = useRef(null)
  useReservarSecoesAbertas(secoesRef, produto)

  const daCor = produto.variacoes.filter((v) => v.cor === cor)
  const variacao = daCor.find((v) => v.tamanho === tamanho)
  // disponivel desconta as peças reservadas por pedidos ainda não enviados (mocks: só estoqueTotal)
  const livre = (v) => v.disponivel ?? v.estoqueTotal
  const esgotado = daCor.every((v) => livre(v) <= 0)

  const escolherCor = (novaCor) => {
    setCor(novaCor)
    // Mantém o tamanho se ele existir na nova cor
    if (!produto.variacoes.some((v) => v.cor === novaCor && v.tamanho === tamanho)) setTamanho('')
  }

  const compartilhar = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      setCopiado(false)
    }
  }

  // O estoque é da rede inteira: se falta na loja que vai enviar, o painel transfere de outra
  const adicionarNaSacola = () => {
    adicionar({
      variacaoId: variacao.id,
      produtoId: produto.id,
      nome: produto.nome,
      cor: variacao.cor,
      tamanho: variacao.tamanho,
      sku: variacao.sku,
      preco: produto.precoBase,
      // Foto enviada no cadastro (sem ela, o carrinho usa a ilustração do produto ou o card da Vulto)
      imagemUrl: produto.imagemUrl ?? null,
      marca: produto.marca ?? 'LORENZI',
      codigoModelo: produto.codigoModelo ?? null,
    })
  }
  const genero = produto.genero?.toLowerCase()

  return (
    <main className="pdp">
      <GaleriaDaPeca fotos={fotosDoProduto(produto, cor)} nome={`${produto.nome}, cor ${cor}`} />

      <div className="pdp__info">
        <nav className="pdp__crumbs" aria-label="Você está em">
          {produto.marca === 'VULTO' ? <Link to="/vulto/loja">Loja</Link> : genero && <Link to={`/colecao/${genero}`}>{produto.genero}</Link>}
          <span aria-hidden="true">/</span>
          <span>{produto.categoria}</span>
        </nav>

        <h1 className="pdp__title">{produto.nome}</h1>
        <p className="pdp__price">{formatCurrency(produto.precoBase)}</p>

        {/* Seletor de cor só aparece quando a peça tem mais de uma cor */}
        <div className={`pdp__options ${cores.length > 1 ? '' : 'pdp__options--single'}`}>
          {cores.length > 1 && (
            <label className="pdp__field">
              <span className="sr-only">Cor</span>
              <Select className="pdp__select" value={cor} onChange={(e) => escolherCor(e.target.value)}>
                {cores.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </label>
          )}

          <label className="pdp__field">
            <span className="sr-only">Tamanho</span>
            <Select
              className="pdp__select"
              value={tamanho}
              onChange={(e) => setTamanho(e.target.value)}
            >
              <option value="">Selecione o tamanho</option>
              {daCor.map((v) => (
                <option key={v.id} value={v.tamanho} disabled={livre(v) <= 0}>
                  {v.tamanho}
                  {livre(v) <= 0 ? ' · esgotado' : ''}
                </option>
              ))}
            </Select>
          </label>
        </div>

        {esgotado ? (
          <span className="pdp__cta pdp__cta--off">Esgotado nesta cor</span>
        ) : variacao ? (
          <button type="button" className="pdp__cta" onClick={adicionarNaSacola}>
            Adicionar à sacola
          </button>
        ) : (
          <span className="pdp__cta pdp__cta--off" aria-disabled="true">
            Selecione um tamanho
          </span>
        )}


        {produto.descricao && <p className="pdp__description">{produto.descricao}</p>}
        <p className="pdp__note">
          Frete grátis acima de R$ 1.000
          <br />
          Trocas em até 30 dias
        </p>

        <div className="pdp__sections" ref={secoesRef}>

          <Secao titulo="Detalhes" abertaInicial>
            <dl className="pdp-details">
              {produto.composicao && (
                <>
                  <dt>Composição</dt>
                  <dd>{produto.composicao}</dd>
                </>
              )}
              {produto.cuidados && (
                <>
                  <dt>Cuidados</dt>
                  <dd>{produto.cuidados}</dd>
                </>
              )}
              <dt>Categoria</dt>
              <dd>{produto.categoria}</dd>
              {produto.estacao && (
                <>
                  <dt>Estação</dt>
                  <dd>{produto.estacao}</dd>
                </>
              )}
            </dl>
          </Secao>

          <Secao titulo="Entrega">
            <p>Frete Padrão grátis em compras acima de R$ 1.000. Opção Expresso para todo o Brasil. O prazo aparece no checkout, a partir do CEP.</p>
          </Secao>

          <Secao titulo="Trocas e devoluções">
            <p>
              Trocas por outro tamanho, cor ou modelo e devoluções em até 30 dias após o recebimento. É só entrar na{' '}
              <Link to="/cliente/solicitacoes/nova">sua conta</Link> e abrir uma solicitação.
            </p>
          </Secao>

          <Secao titulo="Compartilhar">
            <button type="button" className="pdp__share" onClick={compartilhar}>
              {copiado ? 'Link copiado' : 'Copiar link da peça'}
            </button>
          </Secao>
        </div>
      </div>
    </main>
  )
}
