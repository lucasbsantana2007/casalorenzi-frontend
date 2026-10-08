import { Minus, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AsyncContent } from '../components/ui/AsyncContent'
import { imagemDoProduto } from '../data/imagensProdutos'
import { useAsync } from '../hooks/useAsync'
import { useSacola } from '../hooks/useSacola'
import { produtosService } from '../services/produtosService'
import { formatCurrency } from '../utils/format'
import { NotFoundPage } from './NotFoundPage'

const unicos = (lista) => [...new Set(lista)]

function Secao({ titulo, children, abertaInicial = false }) {
  const [aberta, setAberta] = useState(abertaInicial)
  return (
    <div className="pdp-section">
      <button type="button" className="pdp-section__toggle" aria-expanded={aberta} onClick={() => setAberta((v) => !v)}>
        {titulo}
        {aberta ? <Minus size={14} aria-hidden="true" /> : <Plus size={14} aria-hidden="true" />}
      </button>
      {aberta && <div className="pdp-section__body">{children}</div>}
    </div>
  )
}

export function ProdutoPage() {
  const { id } = useParams()
  const state = useAsync(() => produtosService.obter(id), [id])

  if (state.error?.status === 404) return <NotFoundPage homePath="/" />

  return (
    <AsyncContent state={state} isEmpty={() => false}>
      {(produto) => (produto.ativo ? <Produto produto={produto} /> : <NotFoundPage homePath="/" />)}
    </AsyncContent>
  )
}

function Produto({ produto }) {
  const { adicionar } = useSacola()
  const cores = unicos(produto.variacoes.map((v) => v.cor))
  const [cor, setCor] = useState(cores[0])
  const [tamanho, setTamanho] = useState('')
  const [copiado, setCopiado] = useState(false)

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
      // Foto enviada no cadastro (sem ela, o carrinho usa a ilustração do produto)
      imagemUrl: produto.imagemUrl ?? null,
    })
  }
  const genero = produto.genero?.toLowerCase()

  return (
    <main className="pdp">
      <div className="pdp__media">
        <img src={imagemDoProduto(produto)} alt={`${produto.nome}, cor ${cor}`} />
      </div>

      <div className="pdp__info">
        <nav className="pdp__crumbs" aria-label="Você está em">
          {genero && <Link to={`/colecao/${genero}`}>{produto.genero}</Link>}
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
              <select className="pdp__select" value={cor} onChange={(e) => escolherCor(e.target.value)}>
                {cores.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="pdp__field">
            <span className="sr-only">Tamanho</span>
            <select
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
            </select>
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

        <div className="pdp__sections">

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
              <dt>Estação</dt>
              <dd>{produto.estacao}</dd>
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
