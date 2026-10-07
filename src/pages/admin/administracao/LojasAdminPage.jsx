import { Pencil, Plus, Store } from 'lucide-react'
import { useState } from 'react'
import { AsyncContent } from '../../../components/ui/AsyncContent'
import { DataTable } from '../../../components/ui/DataTable'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Field } from '../../../components/ui/Field'
import { FormError } from '../../../components/ui/FormError'
import { Modal } from '../../../components/ui/Modal'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { useAsync } from '../../../hooks/useAsync'
import { administracaoService } from '../../../services/administracaoService'
import { formatNumber } from '../../../utils/format'

const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']

export function LojasAdminPage() {
  const state = useAsync(() => administracaoService.listarLojas(), [])
  const [form, setForm] = useState({ open: false, loja: null })

  const columns = [
    {
      key: 'nome',
      header: 'Loja',
      render: (l) => (
        <>
          <span className="cell-main">{l.nome}</span>
          <span className="cell-sub">
            {l.cidade}, {l.uf}
          </span>
        </>
      ),
    },
    { key: 'endereco', header: 'Endereço', render: (l) => (l.endereco ? <span className="cell-sub cell-sub--wrap">{l.endereco}</span> : <span className="subtle">—</span>) },
    { key: 'telefone', header: 'Contato', render: (l) => <span className="nowrap">{l.telefone || '—'}</span> },
    { key: 'funcionariosAtivos', header: 'Equipe', align: 'right', render: (l) => formatNumber(l.funcionariosAtivos) },
    { key: 'pecasEmEstoque', header: 'Peças', align: 'right', render: (l) => <span className="qty">{formatNumber(l.pecasEmEstoque)}</span> },
    { key: 'ativa', header: 'Status', render: (l) => <StatusBadge type="loja" value={l.ativa} /> },
    {
      key: 'acoes',
      header: <span className="sr-only">Ações</span>,
      align: 'right',
      render: (l) => (
        <div className="row-actions">
          <button type="button" className="btn btn-ghost btn-icon" onClick={() => setForm({ open: true, loja: l })} aria-label={`Editar ${l.nome}`} title="Editar">
            <Pencil size={15} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <div className="toolbar">
        {state.data && <span className="toolbar__summary">{state.data.filter((l) => l.ativa).length} lojas ativas</span>}
        <span className="toolbar__spacer" />
        <button type="button" className="btn btn-primary" onClick={() => setForm({ open: true, loja: null })}>
          <Plus size={16} /> Nova loja
        </button>
      </div>

      <AsyncContent state={state} empty={<EmptyState icon={Store} title="Nenhuma loja cadastrada" />}>
        {(lista) => <DataTable columns={columns} rows={lista} caption="Lojas" />}
      </AsyncContent>

      <Modal
        open={form.open}
        onClose={() => setForm({ open: false, loja: null })}
        size="lg"
        title={form.loja ? `Editar ${form.loja.nome}` : 'Nova loja'}
        description="Endereço, contato e horários aparecem na página Lojas do site. Loja nova já nasce com estoque zerado de todos os produtos."
      >
        {form.open && <LojaForm loja={form.loja} onClose={() => setForm({ open: false, loja: null })} onSaved={state.reload} />}
      </Modal>
    </>
  )
}

function LojaForm({ loja, onClose, onSaved }) {
  const [form, setForm] = useState({
    nome: loja?.nome ?? '',
    cidade: loja?.cidade ?? '',
    uf: loja?.uf ?? '',
    endereco: loja?.endereco ?? '',
    telefone: loja?.telefone ?? '',
    horarios: (loja?.horarios ?? []).join('\n'),
    ativa: loja?.ativa ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const desativandoComEquipe = loja?.ativa && !form.ativa && loja.funcionariosAtivos > 0

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setSaving(true)
    const dados = { ...form, horarios: form.horarios.split('\n') }
    try {
      if (loja) await administracaoService.atualizarLoja(loja.id, dados)
      else await administracaoService.criarLoja(dados)
      onSaved()
      onClose()
    } catch (err) {
      setError(err)
      setSaving(false)
    }
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <div className="form-grid">
        <Field label="Nome da loja" className="span-2">
          <input className="input" value={form.nome} onChange={set('nome')} placeholder="Ex.: Jardins" required />
        </Field>
        <Field label="Cidade">
          <input className="input" value={form.cidade} onChange={set('cidade')} required />
        </Field>
        <Field label="Estado">
          <select className="select" value={form.uf} onChange={set('uf')} required>
            <option value="">Selecione…</option>
            {UFS.map((uf) => (
              <option key={uf}>{uf}</option>
            ))}
          </select>
        </Field>
        <Field label="Endereço" className="span-2">
          <input className="input" value={form.endereco} onChange={set('endereco')} placeholder="Rua, número, bairro, cidade - UF" />
        </Field>
        <Field label="Telefone">
          <input className="input" type="tel" value={form.telefone} onChange={set('telefone')} placeholder="+55 11 90000-0000" />
        </Field>
        <span />
        <Field label="Horários" hint="Um por linha. Ex.: Segunda a sábado: 10:00–22:00" className="span-2">
          <textarea className="textarea" rows={3} value={form.horarios} onChange={set('horarios')} />
        </Field>
        <label className="checkbox span-2">
          <input type="checkbox" checked={form.ativa} onChange={set('ativa')} />
          Loja ativa (aparece no site e pode despachar pedidos)
        </label>
      </div>
      {desativandoComEquipe && (
        <p className="form-alerta" role="status">
          Esta loja tem {loja.funcionariosAtivos} {loja.funcionariosAtivos === 1 ? 'funcionário ativo' : 'funcionários ativos'}. Eles continuam com acesso; mude a loja ou desative-os em Funcionários.
        </p>
      )}
      <FormError error={error} />
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Salvando…' : loja ? 'Salvar alterações' : 'Cadastrar loja'}
        </button>
      </div>
    </form>
  )
}
