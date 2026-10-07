import { Calculator, Truck } from 'lucide-react'
import { useState } from 'react'
import { AsyncContent } from '../../../components/ui/AsyncContent'
import { Field } from '../../../components/ui/Field'
import { FormError } from '../../../components/ui/FormError'
import { useAsync } from '../../../hooks/useAsync'
import { freteService } from '../../../services/freteService'
import { formatCurrency } from '../../../utils/format'
import { formatarCep } from '../../../utils/frete'

const TIPOS = [
  ['padrao', 'Padrão'],
  ['expresso', 'Expresso'],
]

export function FretePage() {
  const state = useAsync(() => freteService.obterConfig(), [])
  return (
    <div className="stack">
      <AsyncContent state={state}>{(config) => <ConfigFrete inicial={config} onSaved={state.setData} />}</AsyncContent>
      <SimuladorFrete />
    </div>
  )
}

// Edita uma cópia; "Salvar" manda tudo de uma vez e o servidor registra no log só o que mudou
function ConfigFrete({ inicial, onSaved }) {
  const [config, setConfig] = useState(() => structuredClone(inicial))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [salvo, setSalvo] = useState(false)
  const alterado = JSON.stringify(config) !== JSON.stringify(inicial)

  const alterar = (regiao, tipo, campo, valor) => {
    setSalvo(false)
    setConfig((c) => ({ ...c, regioes: c.regioes.map((r) => (r.regiao === regiao ? { ...r, [tipo]: { ...r[tipo], [campo]: valor } } : r)) }))
  }

  async function salvar(event) {
    event.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const atualizado = await freteService.salvarConfig(config)
      setConfig(structuredClone(atualizado))
      onSaved(atualizado)
      setSalvo(true)
    } catch (err) {
      setError(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="card" onSubmit={salvar}>
      <div className="card__header">
        <div>
          <h2 className="card__title">Tabela de frete</h2>
          <p className="card__subtitle">Por região do CEP: quanto o cliente paga, quanto o envio custa para a loja e o prazo. O cliente nunca vê o custo.</p>
        </div>
      </div>
      <div className="card__body stack">
        <div className="frete-geral">
          <Field label="Frete Padrão grátis a partir de (R$)" hint="Nas compras acima deste valor, o Padrão sai de graça para o cliente; a loja continua pagando o custo.">
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={config.gratisMinimo}
              onChange={(e) => {
                setSalvo(false)
                setConfig((c) => ({ ...c, gratisMinimo: e.target.value }))
              }}
              required
            />
          </Field>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={config.expressoAtivo}
              onChange={(e) => {
                setSalvo(false)
                setConfig((c) => ({ ...c, expressoAtivo: e.target.checked }))
              }}
            />
            Oferecer frete Expresso no checkout
          </label>
        </div>

        <div className="table-wrap">
          <div className="table-scroll">
            <table className="table frete-tabela">
              <caption className="sr-only">Valores, custos e prazos de frete por região</caption>
              <thead>
                <tr>
                  <th rowSpan={2}>Região</th>
                  {TIPOS.map(([tipo, rotulo]) => (
                    <th key={tipo} colSpan={4} className="frete-tabela__grupo">
                      {rotulo}
                    </th>
                  ))}
                </tr>
                <tr>
                  {TIPOS.map(([tipo]) => [
                    <th key={`${tipo}-v`}>Cliente paga</th>,
                    <th key={`${tipo}-c`}>Custo</th>,
                    <th key={`${tipo}-r`}>Diferença</th>,
                    <th key={`${tipo}-p`}>Prazo (dias)</th>,
                  ])}
                </tr>
              </thead>
              <tbody>
                {config.regioes.map((r) => (
                  <tr key={r.regiao}>
                    <th scope="row" className="frete-tabela__regiao">
                      {r.nome}
                    </th>
                    {TIPOS.map(([tipo, rotulo]) => {
                      const diferenca = Number(r[tipo].valor) - Number(r[tipo].custo)
                      const desligado = tipo === 'expresso' && !config.expressoAtivo
                      return [
                        <td key={`${tipo}-v`}>
                          <input className="input input--num" type="number" min="0" step="0.01" value={r[tipo].valor} onChange={(e) => alterar(r.regiao, tipo, 'valor', e.target.value)} disabled={desligado} aria-label={`${r.nome} · ${rotulo} · cliente paga`} required />
                        </td>,
                        <td key={`${tipo}-c`}>
                          <input className="input input--num" type="number" min="0" step="0.01" value={r[tipo].custo} onChange={(e) => alterar(r.regiao, tipo, 'custo', e.target.value)} disabled={desligado} aria-label={`${r.nome} · ${rotulo} · custo`} required />
                        </td>,
                        <td key={`${tipo}-r`} className={`nowrap frete-tabela__diferenca ${diferenca < 0 ? 'is-negativa' : ''}`}>
                          {Number.isFinite(diferenca) ? formatCurrency(diferenca) : '—'}
                        </td>,
                        <td key={`${tipo}-p`}>
                          <input className="input input--num input--prazo" type="number" min="1" step="1" value={r[tipo].prazoDias} onChange={(e) => alterar(r.regiao, tipo, 'prazoDias', e.target.value)} disabled={desligado} aria-label={`${r.nome} · ${rotulo} · prazo em dias`} required />
                        </td>,
                      ]
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <FormError error={error} />
        <div className="form-actions">
          {salvo && !alterado && (
            <span className="form-ok" role="status">
              Frete salvo. A alteração está no log.
            </span>
          )}
          <button type="button" className="btn btn-secondary" onClick={() => setConfig(structuredClone(inicial))} disabled={!alterado || saving}>
            Descartar alterações
          </button>
          <button type="submit" className="btn btn-primary" disabled={!alterado || saving}>
            {saving ? 'Salvando…' : 'Salvar frete'}
          </button>
        </div>
      </div>
    </form>
  )
}

// Quanto o cliente paga, quanto custa e a diferença para um CEP e um valor de compra (usa a tabela salva)
function SimuladorFrete() {
  const [cep, setCep] = useState('')
  const [subtotal, setSubtotal] = useState('500')
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState(null)

  async function simular(event) {
    event.preventDefault()
    setError(null)
    try {
      setResultado(await freteService.simular({ cep, subtotal: Number(subtotal) }))
    } catch (err) {
      setError(err)
    }
  }

  return (
    <form className="card" onSubmit={simular}>
      <div className="card__header">
        <div>
          <h2 className="card__title">Simular frete</h2>
          <p className="card__subtitle">Usa a tabela salva. Mostra o que o cliente paga e quanto o envio custa para a loja.</p>
        </div>
      </div>
      <div className="card__body stack">
        <div className="frete-simulador">
          <Field label="CEP de entrega">
            <input className="input" inputMode="numeric" value={cep} onChange={(e) => setCep(formatarCep(e.target.value))} placeholder="00000-000" required />
          </Field>
          <Field label="Valor da compra (R$)">
            <input className="input" type="number" min="0" step="0.01" value={subtotal} onChange={(e) => setSubtotal(e.target.value)} required />
          </Field>
          <button type="submit" className="btn btn-secondary" disabled={cep.length < 9}>
            <Calculator size={15} /> Simular
          </button>
        </div>
        <FormError error={error} />
        {resultado &&
          (resultado.length ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Opção</th>
                    <th className="align-right">Cliente paga</th>
                    <th className="align-right">Custo</th>
                    <th className="align-right">Diferença</th>
                    <th className="align-right">Prazo</th>
                  </tr>
                </thead>
                <tbody>
                  {resultado.map((o) => (
                    <tr key={o.tipo}>
                      <td>
                        <Truck size={14} aria-hidden="true" /> {o.label}
                      </td>
                      <td className="align-right">{o.valor === 0 ? 'Grátis' : formatCurrency(o.valor)}</td>
                      <td className="align-right">{formatCurrency(o.custo)}</td>
                      <td className={`align-right frete-tabela__diferenca ${o.resultado < 0 ? 'is-negativa' : ''}`}>{formatCurrency(o.resultado)}</td>
                      <td className="align-right">{o.prazoDias} dias úteis</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="subtle">Ainda não entregamos neste CEP.</p>
          ))}
      </div>
    </form>
  )
}
