import { ArrowLeft, PackageCheck, Truck, XCircle } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AsyncContent } from '../../../components/ui/AsyncContent'
import { FormError } from '../../../components/ui/FormError'
import { PageHeader } from '../../../components/ui/PageHeader'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { useAsync } from '../../../hooks/useAsync'
import { useLojas } from '../../../hooks/useCadastros'
import { useSession } from '../../../hooks/useSession'
import { pedidosService } from '../../../services/pedidosService'
import { formatCurrency, formatDateTime } from '../../../utils/format'
import { aguardaTransferencia, FORMA_PAGAMENTO } from '../../../utils/pedidos'
import { STATUS } from '../../../utils/status'

export function PedidoDetalhePage() {
  const { id } = useParams()
  const state = useAsync(() => pedidosService.obter(id), [id])

  return (
    <>
      <Link to="/pedidos" className="back-link">
        <ArrowLeft size={14} /> Pedidos
      </Link>
      <AsyncContent state={state} isEmpty={() => false}>
        {(pedido) => <PedidoDetalhe pedido={pedido} onChange={state.setData} />}
      </AsyncContent>
    </>
  )
}

function PedidoDetalhe({ pedido, onChange }) {
  const { usuario } = useSession()
  const lojas = useLojas()
  const [rastreio, setRastreio] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)
  const isAdmin = usuario.papel === 'ADMINISTRADOR'
  const emSeparacao = pedido.status === 'PROCESSANDO'
  const faltaPeca = pedido.itens.some((i) => i.saldoNaLoja < i.quantidade)

  const atualizar = async (dados) => {
    setErro(null)
    setSalvando(true)
    try {
      onChange(await pedidosService.atualizar(pedido.id, { ...dados, usuarioId: usuario.id }))
      setRastreio('')
    } catch (error) {
      setErro(error)
    } finally {
      setSalvando(false)
    }
  }

  const e = pedido.endereco

  return (
    <>
      <PageHeader
        eyebrow={pedido.canal}
        title={`Pedido ${pedido.numero}`}
        description={`Feito em ${formatDateTime(pedido.criadoEm)} · ${formatCurrency(pedido.total)}`}
        actions={<StatusBadge type="pedido" value={pedido.status} />}
      />

      <div className="detail-grid">
        <div className="stack">
          <div className="card">
            <div className="card__header">
              <div>
                <h2 className="card__title">Itens</h2>
                <p className="card__subtitle">Saldo na loja de expedição ({pedido.loja?.nome})</p>
              </div>
            </div>
            <div className="table-wrap">
              <div className="table-scroll">
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">Produto</th>
                      <th scope="col">SKU</th>
                      <th scope="col" className="align-right">Qtd.</th>
                      <th scope="col" className="align-right">Na loja</th>
                      <th scope="col" className="align-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedido.itens.map((item) => {
                      const falta = emSeparacao && item.saldoNaLoja < item.quantidade
                      return (
                        <tr key={item.variacaoId}>
                          <td>
                            <span className="cell-main">{item.variacao.produto.nome}</span>
                            <span className="cell-sub">
                              {item.variacao.cor} · {item.variacao.tamanho}
                            </span>
                          </td>
                          <td className="mono">{item.variacao.sku}</td>
                          <td className="align-right">{item.quantidade}</td>
                          <td className={`align-right ${falta ? 'text-danger' : ''}`}>{emSeparacao ? item.saldoNaLoja : '—'}</td>
                          <td className="align-right">{formatCurrency(item.precoUnitario * item.quantidade)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <dl className="order-admin-totals">
              <div>
                <dt>Subtotal</dt>
                <dd>{formatCurrency(pedido.subtotal ?? pedido.total)}</dd>
              </div>
              {pedido.frete && (
                <div>
                  <dt>
                    Frete {pedido.frete.label} · até {pedido.frete.prazoDias} dias úteis
                  </dt>
                  <dd>{pedido.frete.valor === 0 ? 'Grátis' : formatCurrency(pedido.frete.valor)}</dd>
                </div>
              )}
              {pedido.frete?.custo !== undefined && (
                <div className="order-admin-totals__custo">
                  <dt>Custo do frete para a loja</dt>
                  <dd>
                    {formatCurrency(pedido.frete.custo)}
                    <small> · {pedido.frete.valor - pedido.frete.custo >= 0 ? 'sobra' : 'loja paga'} {formatCurrency(Math.abs(pedido.frete.valor - pedido.frete.custo))}</small>
                  </dd>
                </div>
              )}
              <div className="order-admin-totals__total">
                <dt>Total</dt>
                <dd>{formatCurrency(pedido.total)}</dd>
              </div>
            </dl>
          </div>

          {pedido.transferencias.length > 0 && (
            <div className="card">
              <div className="card__header">
                <div>
                  <h2 className="card__title">Transferências para este pedido</h2>
                  <p className="card__subtitle">Criadas automaticamente quando a loja de expedição não tem todas as peças</p>
                </div>
              </div>
              <ul className="order-transfers">
                {pedido.transferencias.map((t) => (
                  <li key={t.id}>
                    <span>
                      <strong className="mono">{t.codigo}</strong> · {t.quantidade}× {t.sku}
                      <small>de {t.lojaOrigem?.nome}</small>
                    </span>
                    <StatusBadge type="transferencia" value={t.status} />
                  </li>
                ))}
              </ul>
              <Link to="/transferencias" className="card__footer-link">
                Abrir transferências
              </Link>
            </div>
          )}

          <div className="card">
            <div className="card__header">
              <h2 className="card__title">Histórico</h2>
            </div>
            <ol className="order-timeline">
              {[...pedido.historico].reverse().map((h, i) => (
                <li key={`${h.em}-${i}`}>
                  <strong>{STATUS.pedido[h.status]?.label ?? h.status}</strong>
                  {h.observacao && <span>{h.observacao}</span>}
                  <small>
                    {formatDateTime(h.em)} · {h.usuario?.nome ?? 'Sistema'}
                  </small>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="stack">
          <div className="card">
            <div className="card__header">
              <h2 className="card__title">Ações</h2>
            </div>
            <div className="card__body order-actions">
              {emSeparacao && (
                <>
                  <label className="field">
                    <span className="field__label">Loja de expedição</span>
                    <select
                      className="select"
                      value={pedido.lojaId}
                      onChange={(ev) => atualizar({ lojaId: Number(ev.target.value) })}
                      disabled={!isAdmin || salvando}
                    >
                      {lojas.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.nome}
                        </option>
                      ))}
                    </select>
                    {!isAdmin && <span className="field__hint">Só o administrador troca a loja.</span>}
                  </label>

                  {aguardaTransferencia(pedido) && faltaPeca && (
                    <p className="order-actions__warn">Aguardando peças de outra loja. Conclua as transferências para liberar o envio.</p>
                  )}

                  <label className="field">
                    <span className="field__label">Código de rastreio</span>
                    <input className="input" value={rastreio} onChange={(ev) => setRastreio(ev.target.value)} placeholder="BR000000000SP" />
                  </label>
                  <button type="button" className="btn btn-primary" disabled={salvando || faltaPeca || !rastreio.trim()} onClick={() => atualizar({ status: 'ENVIADO', codigoRastreio: rastreio })}>
                    <Truck size={15} /> Marcar como enviado
                  </button>
                  <button type="button" className="btn btn-ghost order-actions__cancel" disabled={salvando} onClick={() => atualizar({ status: 'CANCELADO' })}>
                    <XCircle size={15} /> Cancelar pedido e estornar
                  </button>
                </>
              )}
              {pedido.status === 'ENVIADO' && (
                <>
                  <p>
                    Rastreio <strong className="mono">{pedido.codigoRastreio}</strong>
                  </p>
                  <button type="button" className="btn btn-primary" disabled={salvando} onClick={() => atualizar({ status: 'ENTREGUE' })}>
                    <PackageCheck size={15} /> Confirmar entrega
                  </button>
                </>
              )}
              {['ENTREGUE', 'CANCELADO'].includes(pedido.status) && <p className="subtle">Pedido finalizado. Nenhuma ação pendente.</p>}
              <FormError error={erro} />
            </div>
          </div>

          <div className="card">
            <div className="card__header">
              <h2 className="card__title">Cliente</h2>
            </div>
            <div className="card__body">
              <dl className="details-list">
                <div>
                  <dt>Nome</dt>
                  <dd>{pedido.contato?.nome ?? '—'}</dd>
                </div>
                <div>
                  <dt>E-mail</dt>
                  <dd>{pedido.contato?.email ?? '—'}</dd>
                </div>
                <div>
                  <dt>Telefone</dt>
                  <dd className="nowrap">{pedido.contato?.telefone || '—'}</dd>
                </div>
                <div>
                  <dt>Conta</dt>
                  <dd>{pedido.clienteId ? 'Cliente cadastrado' : 'Compra sem conta'}</dd>
                </div>
              </dl>
            </div>
          </div>

          {e && (
            <div className="card">
              <div className="card__header">
                <h2 className="card__title">Entrega</h2>
              </div>
              <div className="card__body">
                <p>
                  {e.rua}, {e.numero}
                  {e.complemento ? ` · ${e.complemento}` : ''}
                  <br />
                  {e.bairro} · {e.cidade}/{e.uf}
                  <br />
                  CEP {e.cep.replace(/(\d{5})(\d{3})/, '$1-$2')}
                </p>
              </div>
            </div>
          )}

          {pedido.pagamento && (
            <div className="card">
              <div className="card__header">
                <h2 className="card__title">Pagamento</h2>
              </div>
              <div className="card__body">
                <p>
                  {FORMA_PAGAMENTO[pedido.pagamento.metodo]}
                  {pedido.pagamento.metodo === 'CARTAO' && ` · ${pedido.pagamento.parcelas}x`}
                </p>
                <p className="subtle">{pedido.pagamento.status === 'ESTORNADO' ? 'Estornado' : 'Aprovado'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
