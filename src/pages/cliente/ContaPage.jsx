import { CircleCheck, KeyRound, Pencil, Trash2, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AsyncContent } from '../../components/ui/AsyncContent'
import { Field } from '../../components/ui/Field'
import { FormError } from '../../components/ui/FormError'
import { Modal } from '../../components/ui/Modal'
import { useAsync } from '../../hooks/useAsync'
import { useSession } from '../../hooks/useSession'
import { contaService } from '../../services/contaService'
import { formatarCpf } from '../../utils/cpf'
import { formatDate } from '../../utils/format'

const SENHA_MINIMA = 8
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Configurações da conta do cliente: dados pessoais, senha e exclusão da conta
export function ContaPage() {
  const state = useAsync(() => contaService.obter(), [])

  return (
    <>
      <div>
        <p className="eyebrow">Minha conta</p>
        <h1 className="client-title">Configurações da conta</h1>
        <p className="muted">Seus dados de acesso e de contato. O CPF identifica a sua conta e não pode ser alterado.</p>
      </div>
      <AsyncContent state={state} isEmpty={() => false}>
        {(conta) => (
          <div className="account-sections">
            <DadosPessoais conta={conta} onSalvo={state.setData} />
            <Senha />
            <ExcluirConta />
          </div>
        )}
      </AsyncContent>
    </>
  )
}

function Sucesso({ children }) {
  return (
    <p className="form-success row" role="status">
      <CircleCheck size={16} aria-hidden="true" /> {children}
    </p>
  )
}

// ---------- Dados pessoais ----------

function DadosPessoais({ conta, onSalvo }) {
  const [editando, setEditando] = useState(false)
  const [salvo, setSalvo] = useState(false)

  return (
    <section className="account-card" aria-labelledby="conta-dados">
      <header className="account-card__header">
        <UserRound size={20} strokeWidth={1.5} aria-hidden="true" />
        <div>
          <h2 id="conta-dados">Dados pessoais</h2>
          <p>Nome, e-mail de acesso e celular para contato.</p>
        </div>
        {!editando && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSalvo(false)
              setEditando(true)
            }}
          >
            <Pencil size={14} aria-hidden="true" /> Editar
          </button>
        )}
      </header>

      {salvo && !editando && <Sucesso>Dados atualizados.</Sucesso>}

      {editando ? (
        <FormularioDados
          conta={conta}
          onCancelar={() => setEditando(false)}
          onSalvo={(atualizada) => {
            onSalvo(atualizada)
            setEditando(false)
            setSalvo(true)
          }}
        />
      ) : (
        <dl className="account-data">
          <div>
            <dt>Nome completo</dt>
            <dd>{conta.nome}</dd>
          </div>
          <div>
            <dt>E-mail de acesso</dt>
            <dd>{conta.email}</dd>
          </div>
          <div>
            <dt>CPF</dt>
            <dd>{conta.cpf ? formatarCpf(conta.cpf) : '—'}</dd>
          </div>
          <div>
            <dt>Celular</dt>
            <dd>{conta.telefone || '—'}</dd>
          </div>
          <div>
            <dt>Cliente desde</dt>
            <dd>{conta.clienteDesde ? formatDate(`${conta.clienteDesde}T12:00:00`) : '—'}</dd>
          </div>
        </dl>
      )}
    </section>
  )
}

function FormularioDados({ conta, onCancelar, onSalvo }) {
  const { atualizarUsuario } = useSession()
  const [form, setForm] = useState({ nome: conta.nome, email: conta.email, telefone: conta.telefone ?? '', senhaAtual: '' })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)
  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }))
  // Trocar o e-mail (que é o login) pede a senha atual
  const trocaEmail = form.email.trim().toLowerCase() !== conta.email.toLowerCase()
  const pronto = form.nome.trim() && EMAIL_VALIDO.test(form.email.trim()) && (!trocaEmail || form.senhaAtual)

  async function salvar(e) {
    e.preventDefault()
    setErro(null)
    setSalvando(true)
    try {
      const { nome, email, telefone, senhaAtual } = form
      const atualizada = await contaService.atualizar({ nome, email, telefone, ...(trocaEmail && { senhaAtual }) })
      atualizarUsuario({ nome: atualizada.nome, email: atualizada.email })
      onSalvo(atualizada)
    } catch (err) {
      setErro(err)
      setSalvando(false)
    }
  }

  return (
    <form className="account-form" onSubmit={salvar}>
      <div className="form-grid">
        <Field label="Nome completo" className="span-2">
          <input className="input" value={form.nome} onChange={set('nome')} autoComplete="name" maxLength={120} required />
        </Field>
        <Field label="E-mail de acesso" hint="É com ele que você entra no site.">
          <input className="input" type="email" value={form.email} onChange={set('email')} autoComplete="email" required />
        </Field>
        <Field label="Celular">
          <input className="input" type="tel" value={form.telefone} onChange={set('telefone')} autoComplete="tel" placeholder="(11) 90000-0000" maxLength={30} />
        </Field>
        <Field label="CPF" hint="O CPF identifica a sua conta e não pode ser alterado.">
          <input className="input" value={conta.cpf ? formatarCpf(conta.cpf) : ''} disabled />
        </Field>
        {trocaEmail && (
          <Field label="Senha atual" hint="Para trocar o e-mail de acesso, confirme com a sua senha.">
            <input className="input" type="password" value={form.senhaAtual} onChange={set('senhaAtual')} autoComplete="current-password" required />
          </Field>
        )}
      </div>
      <FormError error={erro} />
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancelar} disabled={salvando}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary" disabled={salvando || !pronto}>
          {salvando ? 'Salvando…' : 'Salvar dados'}
        </button>
      </div>
    </form>
  )
}

// ---------- Senha ----------

const SENHA_VAZIA = { senhaAtual: '', senha: '', senhaConfirmacao: '' }

function Senha() {
  const [aberto, setAberto] = useState(false)
  const [form, setForm] = useState(SENHA_VAZIA)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)
  const [salvo, setSalvo] = useState(false)
  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }))
  const curta = form.senha.length > 0 && form.senha.length < SENHA_MINIMA
  const diferentes = form.senhaConfirmacao.length > 0 && form.senha !== form.senhaConfirmacao
  const pronto = form.senhaAtual && form.senha.length >= SENHA_MINIMA && form.senha === form.senhaConfirmacao

  const fechar = () => {
    setAberto(false)
    setForm(SENHA_VAZIA)
    setErro(null)
  }

  async function salvar(e) {
    e.preventDefault()
    setErro(null)
    setSalvando(true)
    try {
      await contaService.trocarSenha(form)
      fechar()
      setSalvo(true)
    } catch (err) {
      setErro(err)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <section className="account-card" aria-labelledby="conta-senha">
      <header className="account-card__header">
        <KeyRound size={20} strokeWidth={1.5} aria-hidden="true" />
        <div>
          <h2 id="conta-senha">Senha</h2>
          <p>Use pelo menos {SENHA_MINIMA} caracteres. Não compartilhe a sua senha.</p>
        </div>
        {!aberto && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSalvo(false)
              setAberto(true)
            }}
          >
            Trocar senha
          </button>
        )}
      </header>

      {salvo && <Sucesso>Senha alterada. Use a nova senha no próximo acesso.</Sucesso>}

      {aberto && (
        <form className="account-form" onSubmit={salvar}>
          <div className="form-grid">
            <Field label="Senha atual" className="span-2">
              <input className="input" type="password" value={form.senhaAtual} onChange={set('senhaAtual')} autoComplete="current-password" required />
            </Field>
            <Field label="Nova senha" hint={curta ? `Mínimo de ${SENHA_MINIMA} caracteres.` : undefined}>
              <input className="input" type="password" value={form.senha} onChange={set('senha')} autoComplete="new-password" aria-invalid={curta} required />
            </Field>
            <Field label="Confirme a nova senha" hint={diferentes ? 'As senhas não conferem.' : undefined}>
              <input
                className="input"
                type="password"
                value={form.senhaConfirmacao}
                onChange={set('senhaConfirmacao')}
                onPaste={(e) => e.preventDefault()}
                autoComplete="new-password"
                aria-invalid={diferentes}
                required
              />
            </Field>
          </div>
          <FormError error={erro} />
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={fechar} disabled={salvando}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={salvando || !pronto}>
              {salvando ? 'Salvando…' : 'Salvar nova senha'}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}

// ---------- Exclusão ----------

function ExcluirConta() {
  const [aberto, setAberto] = useState(false)

  return (
    <section className="account-card account-card--danger" aria-labelledby="conta-excluir">
      <header className="account-card__header">
        <Trash2 size={20} strokeWidth={1.5} aria-hidden="true" />
        <div>
          <h2 id="conta-excluir">Excluir conta</h2>
          <p>Apaga seus dados pessoais e encerra o acesso. Não dá para desfazer.</p>
        </div>
        <button type="button" className="btn btn-danger btn-sm" onClick={() => setAberto(true)}>
          Excluir conta
        </button>
      </header>
      <Modal
        open={aberto}
        onClose={() => setAberto(false)}
        title="Excluir a sua conta?"
        description="Seu nome, e-mail, CPF, celular e senha serão apagados e você não conseguirá mais entrar com esta conta."
        size="sm"
      >
        {aberto && <ConfirmarExclusao onCancelar={() => setAberto(false)} />}
      </Modal>
    </section>
  )
}

function ConfirmarExclusao({ onCancelar }) {
  const navigate = useNavigate()
  const [senha, setSenha] = useState('')
  const [ciente, setCiente] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [erro, setErro] = useState(null)

  async function excluir(e) {
    e.preventDefault()
    setErro(null)
    setExcluindo(true)
    try {
      await contaService.excluir({ senha })
      // A tela de login encerra a sessão e mostra o aviso (sair aqui faria a área do cliente redirecionar antes)
      navigate('/login', { replace: true, state: { contaExcluida: true } })
    } catch (err) {
      setErro(err)
      setExcluindo(false)
    }
  }

  return (
    <form className="account-form" onSubmit={excluir}>
      <p className="muted">
        Seus pedidos e solicitações continuam registrados de forma anônima, porque a loja precisa deles para fins fiscais. Para comprar de novo, crie uma conta nova.
      </p>
      <Field label="Confirme com a sua senha">
        <input className="input" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" required />
      </Field>
      <label className="checkbox">
        <input type="checkbox" checked={ciente} onChange={(e) => setCiente(e.target.checked)} />
        <span>Entendo que a exclusão é definitiva.</span>
      </label>
      <FormError error={erro} />
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancelar} disabled={excluindo}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-danger-solid" disabled={excluindo || !senha || !ciente}>
          {excluindo ? 'Excluindo…' : 'Excluir minha conta'}
        </button>
      </div>
    </form>
  )
}
