import { RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { useAsync } from '../../hooks/useAsync'
import { useSession } from '../../hooks/useSession'
import { copilotoService } from '../../services/copilotoService'
import { formatDateTime } from '../../utils/format'
import { AsyncContent } from '../ui/AsyncContent'
import { EmptyState } from '../ui/EmptyState'
import { Tabs } from '../ui/Tabs'

// Alertas operacionais das automações (estoque baixo, estoque parado, sugestões de transferência, pontos a
// vencer). Cada perfil vê os tipos do que pode acessar; nada é executado sozinho: a equipe resolve ou descarta.
const TIPOS_ALERTA = {
  ESTOQUE_BAIXO: 'Estoque baixo',
  ESTOQUE_PARADO: 'Estoque parado',
  SUGESTAO_TRANSFERENCIA: 'Transferências sugeridas',
  PONTOS_A_VENCER: 'Pontos a vencer',
}
const SEVERIDADE = { ALTA: 'danger', MEDIA: 'warning', BAIXA: 'neutral' }
const ROTULO_SEVERIDADE = { ALTA: 'Alta', MEDIA: 'Média', BAIXA: 'Baixa' }
const STATUS = [
  { value: 'ABERTO', label: 'Abertos' },
  { value: 'RESOLVIDO', label: 'Resolvidos' },
  { value: 'DESCARTADO', label: 'Descartados' },
]

export function AlertasPainel() {
  const { pode } = useSession()
  const admin = pode('administracao')
  const [tipo, setTipo] = useState('')
  const [status, setStatus] = useState('ABERTO')
  const [rodando, setRodando] = useState(false)
  const [aviso, setAviso] = useState(null)
  const state = useAsync(() => copilotoService.alertas({ tipo: tipo || undefined, status }), [tipo, status])

  const atualizar = async (alerta, novo) => {
    try {
      await copilotoService.atualizarAlerta(alerta.id, novo)
      state.reload()
    } catch (e) {
      setAviso(e.message)
    }
  }

  const rodarAutomacoes = async () => {
    setRodando(true)
    setAviso(null)
    try {
      const execucoes = await copilotoService.executarAutomacoes()
      const ignoradas = execucoes.filter((e) => e.status === 'IGNORADA').length
      setAviso(ignoradas ? `${ignoradas} automação(ões) já tinham rodado há menos de um minuto.` : 'Alertas atualizados.')
      state.reload()
    } catch (e) {
      setAviso(e.message)
    } finally {
      setRodando(false)
    }
  }

  return (
    <AsyncContent state={state} isEmpty={() => false} loadingLabel="Carregando alertas…">
      {(dados) => {
        const tipos = Object.keys(dados.abertosPorTipo)
        return (
          <div className="cop-alertas">
            <div className="cop-alertas__resumo">
              {tipos.map((t) => (
                <button key={t} type="button" className={`card cop-alerta-tipo ${tipo === t ? 'is-active' : ''}`} onClick={() => setTipo(tipo === t ? '' : t)}>
                  <span>{TIPOS_ALERTA[t]}</span>
                  <strong>{dados.abertosPorTipo[t]}</strong>
                  <small>abertos</small>
                </button>
              ))}
            </div>

            <div className="cop-alertas__barra">
              <Tabs items={STATUS} value={status} onChange={setStatus} label="Situação dos alertas" />
              {admin && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={rodarAutomacoes} disabled={rodando}>
                  <RefreshCw size={14} aria-hidden="true" /> {rodando ? 'Atualizando…' : 'Atualizar alertas agora'}
                </button>
              )}
            </div>
            {aviso && <p className="cop-aviso">{aviso}</p>}

            {dados.alertas.length === 0 ? (
              <EmptyState title="Nenhum alerta" description="As automações atualizam os alertas quando rodam (agendador ou botão do Administrador)." />
            ) : (
              <ul className="cop-alertas__lista">
                {dados.alertas.map((a) => (
                  <li key={a.id} className="card cop-alerta">
                    <div className="cop-alerta__topo">
                      <span className={`badge badge--${SEVERIDADE[a.severidade] ?? 'neutral'}`}>{ROTULO_SEVERIDADE[a.severidade] ?? a.severidade}</span>
                      <span className="cop-sutil">{TIPOS_ALERTA[a.tipo]}</span>
                      <span className="cop-sutil">· visto em {formatDateTime(a.atualizadoEm)}</span>
                    </div>
                    <strong className="cop-alerta__titulo">{a.titulo}</strong>
                    <p>{a.descricao}</p>
                    {a.dados?.maiores?.length > 0 && (
                      <details>
                        <summary className="cop-sutil">Itens com mais valor parado</summary>
                        <ul className="cop-alerta__itens">
                          {a.dados.maiores.map((i) => (
                            <li key={i.sku}>
                              {i.produto} ({i.sku}) · {i.quantidade} peças · {i.diasSemVenda} dias sem venda
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                    {a.status === 'ABERTO' ? (
                      <div className="cop-alerta__acoes">
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => atualizar(a, 'RESOLVIDO')}>
                          Marcar como resolvido
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => atualizar(a, 'DESCARTADO')}>
                          Descartar
                        </button>
                      </div>
                    ) : (
                      <p className="cop-sutil">
                        {a.status === 'RESOLVIDO' ? 'Resolvido' : 'Descartado'} em {formatDateTime(a.resolvidoEm)}
                        {a.resolvidoPor ? ` por ${a.resolvidoPor.nome}` : ' pela automação (a situação acabou)'}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {admin && dados.automacoes?.length > 0 && (
              <div className="card cop-automacoes">
                <div className="card__header">
                  <div>
                    <h2 className="card__title">Automações</h2>
                    <p className="card__subtitle">Rodam pelo agendador (python -m src.automacoes) ou pelo botão acima. Uma execução por vez, sem duplicar alertas.</p>
                  </div>
                </div>
                <div className="table-wrap">
                  <div className="table-scroll">
                    <table className="table">
                      <thead>
                        <tr>
                          <th scope="col">Automação</th>
                          <th scope="col">Última execução</th>
                          <th scope="col">Resultado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dados.automacoes.map((a) => (
                          <tr key={a.nome}>
                            <td>
                              <strong>{a.descricao}</strong>
                              <div className="cop-sutil mono">{a.nome}</div>
                            </td>
                            <td>{a.ultima ? formatDateTime(a.ultima.terminadaEm) : 'Nunca rodou'}</td>
                            <td>{a.ultima ? `${a.ultima.status} · ${a.ultima.detalhe}` : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      }}
    </AsyncContent>
  )
}
