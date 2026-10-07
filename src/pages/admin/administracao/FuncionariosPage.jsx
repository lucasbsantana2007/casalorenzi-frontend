import { Link2, Mail, Pencil, Plus, UserCheck, UserX, Users } from 'lucide-react'
import { useState } from 'react'
import { AsyncContent } from '../../../components/ui/AsyncContent'
import { DataTable } from '../../../components/ui/DataTable'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Field } from '../../../components/ui/Field'
import { FormError } from '../../../components/ui/FormError'
import { Modal } from '../../../components/ui/Modal'
import { SearchInput } from '../../../components/ui/SearchInput'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { useAsync } from '../../../hooks/useAsync'
import { useLojas } from '../../../hooks/useCadastros'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue'
import { useSession } from '../../../hooks/useSession'
import { administracaoService } from '../../../services/administracaoService'
import { PAPEIS } from '../../../utils/permissions'

const situacao = (f) => (!f.ativo ? 'INATIVO' : f.convitePendente ? 'CONVITE' : 'ATIVO')

export function FuncionariosPage() {
  const lojas = useLojas()
  const { usuario } = useSession()
  const [busca, setBusca] = useState('')
  const [papel, setPapel] = useState('')
  const [lojaId, setLojaId] = useState('')
  const [status, setStatus] = useState('ATIVO')
  const buscaDebounced = useDebouncedValue(busca)
  const state = useAsync(
    () => administracaoService.listarFuncionarios({ busca: buscaDebounced, papel, lojaId, status }),
    [buscaDebounced, papel, lojaId, status],
  )
  const [form, setForm] = useState({ open: false, funcionario: null })
  const [confirmar, setConfirmar] = useState(null)
  const [convite, setConvite] = useState(null) // { nome, linkDemo } (linkDemo só na demonstração)

  async function reenviar(f) {
    const { linkDemo } = await administracaoService.reenviarConvite(f.id)
    setConvite({ nome: f.nome, linkDemo })
    state.reload()
  }

  const columns = [
    {
      key: 'nome',
      header: 'Funcionário',
      render: (f) => (
        <>
          <span className="cell-main">
            {f.nome}
            {f.id === usuario.id && <span className="subtle"> (você)</span>}
          </span>
          <span className="cell-sub">{f.email}</span>
        </>
      ),
    },
    { key: 'papel', header: 'Cargo', render: (f) => <span className="tag">{PAPEIS[f.papel]}</span> },
    { key: 'loja', header: 'Loja', render: (f) => f.loja?.nome ?? <span className="subtle">Toda a rede</span> },
    { key: 'status', header: 'Status', render: (f) => <StatusBadge type="funcionario" value={situacao(f)} /> },
    {
      key: 'acoes',
      header: <span className="sr-only">Ações</span>,
      align: 'right',
      render: (f) => (
        <div className="row-actions">
          {f.convitePendente && f.ativo && (
            <button type="button" className="btn btn-ghost btn-icon" onClick={() => reenviar(f)} aria-label={`Reenviar convite para ${f.nome}`} title="Reenviar convite">
              <Mail size={15} />
            </button>
          )}
          <button type="button" className="btn btn-ghost btn-icon" onClick={() => setForm({ open: true, funcionario: f })} aria-label={`Editar ${f.nome}`} title="Editar">
            <Pencil size={15} />
          </button>
          {f.ativo ? (
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              onClick={() => setConfirmar(f)}
              disabled={f.id === usuario.id}
              aria-label={`Desativar ${f.nome}`}
              title={f.id === usuario.id ? 'Você não pode desativar a sua própria conta' : 'Desativar acesso'}
            >
              <UserX size={15} />
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              onClick={async () => {
                await administracaoService.alterarStatusFuncionario(f.id, { ativo: true })
                state.reload()
              }}
              aria-label={`Reativar ${f.nome}`}
              title="Reativar acesso"
            >
              <UserCheck size={15} />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <>
      <div className="toolbar">
        <SearchInput value={busca} onChange={setBusca} placeholder="Buscar por nome ou e-mail" />
        <select className="select" value={papel} onChange={(e) => setPapel(e.target.value)} aria-label="Cargo">
          <option value="">Todos os cargos</option>
          {Object.entries(PAPEIS).map(([valor, rotulo]) => (
            <option key={valor} value={valor}>
              {rotulo}
            </option>
          ))}
        </select>
        <select className="select" value={lojaId} onChange={(e) => setLojaId(e.target.value)} aria-label="Loja">
          <option value="">Todas as lojas</option>
          {lojas.map((l) => (
            <option key={l.id} value={l.id}>
              {l.nome}
            </option>
          ))}
        </select>
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="ATIVO">Ativos</option>
          <option value="INATIVO">Desativados</option>
          <option value="">Todos</option>
        </select>
        {state.data && <span className="toolbar__summary">{state.data.length} funcionários</span>}
        <span className="toolbar__spacer" />
        <button type="button" className="btn btn-primary" onClick={() => setForm({ open: true, funcionario: null })}>
          <Plus size={16} /> Novo funcionário
        </button>
      </div>

      <AsyncContent state={state} empty={<EmptyState icon={Users} title="Nenhum funcionário encontrado" description="Ajuste os filtros ou cadastre um novo funcionário." />}>
        {(lista) => <DataTable columns={columns} rows={lista} caption="Funcionários" />}
      </AsyncContent>

      <FuncionarioFormModal
        open={form.open}
        funcionario={form.funcionario}
        lojas={lojas}
        onClose={() => setForm({ open: false, funcionario: null })}
        onSaved={(resultado) => {
          state.reload()
          // Funcionário novo: o convite saiu por e-mail (editar não manda convite)
          if (resultado?.funcionario) setConvite({ nome: resultado.funcionario.nome, linkDemo: resultado.linkDemo })
        }}
      />
      <DesativarModal
        funcionario={confirmar}
        onClose={() => setConfirmar(null)}
        onDone={() => {
          setConfirmar(null)
          state.reload()
        }}
      />
      <ConviteModal convite={convite} onClose={() => setConvite(null)} />
    </>
  )
}

function FuncionarioFormModal({ open, funcionario, lojas, onClose, onSaved }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={funcionario ? 'Editar funcionário' : 'Novo funcionário'}
      description={funcionario ? 'Dados de acesso e cargo. A alteração fica registrada no log.' : 'O funcionário recebe por e-mail um convite para criar a própria senha.'}
    >
      {open && <FuncionarioForm funcionario={funcionario} lojas={lojas} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  )
}

function FuncionarioForm({ funcionario, lojas, onClose, onSaved }) {
  const [form, setForm] = useState({
    nome: funcionario?.nome ?? '',
    email: funcionario?.email ?? '',
    papel: funcionario?.papel ?? 'LOJISTA',
    lojaId: funcionario?.lojaId ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }))
  const administrador = form.papel === 'ADMINISTRADOR'

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setSaving(true)
    const dados = { ...form, lojaId: administrador ? null : Number(form.lojaId) || null }
    try {
      const resultado = funcionario ? await administracaoService.atualizarFuncionario(funcionario.id, dados) : await administracaoService.criarFuncionario(dados)
      onSaved(resultado)
      onClose()
    } catch (err) {
      setError(err)
      setSaving(false)
    }
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <div className="form-grid">
        <Field label="Nome completo" className="span-2">
          <input className="input" value={form.nome} onChange={set('nome')} autoComplete="off" required />
        </Field>
        <Field label="E-mail de acesso" className="span-2">
          <input className="input" type="email" value={form.email} onChange={set('email')} placeholder="nome@casalorenzi.com.br" autoComplete="off" required />
        </Field>
        <Field label="Cargo" hint={administrador ? 'Acesso a toda a rede, inclusive esta central.' : undefined}>
          <select className="select" value={form.papel} onChange={set('papel')} required>
            {Object.entries(PAPEIS).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Loja">
          <select className="select" value={administrador ? '' : form.lojaId} onChange={set('lojaId')} disabled={administrador} required={!administrador}>
            <option value="">{administrador ? 'Toda a rede' : 'Selecione…'}</option>
            {lojas
              .filter((l) => l.ativa !== false || l.id === funcionario?.lojaId)
              .map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nome}
                </option>
              ))}
          </select>
        </Field>
      </div>
      <FormError error={error} />
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Salvando…' : funcionario ? 'Salvar alterações' : 'Cadastrar e enviar convite'}
        </button>
      </div>
    </form>
  )
}

function DesativarModal({ funcionario, onClose, onDone }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function desativar() {
    setError(null)
    setSaving(true)
    try {
      await administracaoService.alterarStatusFuncionario(funcionario.id, { ativo: false })
      onDone()
    } catch (err) {
      setError(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={Boolean(funcionario)}
      onClose={onClose}
      size="sm"
      title="Desativar acesso"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="btn btn-danger" onClick={desativar} disabled={saving}>
            {saving ? 'Desativando…' : 'Desativar'}
          </button>
        </>
      }
    >
      {funcionario && (
        <div className="stack-sm">
          <p>
            <strong>{funcionario.nome}</strong> não vai mais conseguir entrar no painel. O histórico de ações dele continua registrado, e o acesso pode ser reativado
            depois.
          </p>
          <FormError error={error} />
        </div>
      )}
    </Modal>
  )
}

// Confirma o envio do convite; na demonstração (LINK_SENHA_NA_RESPOSTA=true), mostra também o link
function ConviteModal({ convite, onClose }) {
  return (
    <Modal open={Boolean(convite)} onClose={onClose} size="sm" title="Convite enviado">
      {convite && (
        <div className="stack-sm">
          <p>
            Enviamos para <strong>{convite.nome}</strong> um e-mail com o link para criar a senha. O link vale por 7 dias.
          </p>
          {convite.linkDemo && (
            <>
              <p className="subtle">Demonstração: o link também aparece aqui. Copie para testar o primeiro acesso numa janela anônima.</p>
              <div className="convite-link">
                <Link2 size={14} aria-hidden="true" />
                <code>{`${window.location.origin}${convite.linkDemo}`}</code>
              </div>
            </>
          )}
          <div className="form-actions">
            {convite.linkDemo && (
              <button type="button" className="btn btn-secondary" onClick={() => navigator.clipboard?.writeText(`${window.location.origin}${convite.linkDemo}`)}>
                Copiar link
              </button>
            )}
            <button type="button" className="btn btn-primary" onClick={onClose}>
              Concluir
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
