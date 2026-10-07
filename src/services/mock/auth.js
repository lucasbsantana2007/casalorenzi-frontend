import { SENHA_DEMO } from '../../context/perfisDemo'
import { cpfValido, somenteDigitosCpf } from '../../utils/cpf'
import { clientePorEmail, clientePorId, db, fail, respond } from './db'

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const SENHA_MINIMA = 8

// Só na demonstração: hash SHA-256 com o id da conta como sal (CPF no cliente). A API real usa bcrypt.
async function hashSenha(sal, senha) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${sal}:${senha}`))
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Senha trocada pelo "Esqueceu a senha?" vira hash; sem hash, vale a senha de demonstração
const senhaConfere = async (conta, senha) => (conta.senhaHash ? conta.senhaHash === (await hashSenha(String(conta.id), senha)) : senha === SENHA_DEMO)

const sessaoDoCliente = (c) => ({ token: `demo-cliente-${c.id}`, usuario: { id: c.id, nome: c.nome, email: c.email, papel: 'CLIENTE', lojaId: null } })

// Mesmo endpoint para equipe e clientes; o papel do usuário define a área de acesso.
export async function login({ email, senha }) {
  const alvo = String(email ?? '').trim().toLowerCase()
  const usuario = db.usuarios.find((u) => u.email.toLowerCase() === alvo)
  if (usuario) {
    if (!(await senhaConfere(usuario, senha))) return fail('E-mail ou senha incorretos.', 401)
    const { id, nome, papel, lojaId = null } = usuario
    return respond({ token: `demo-${id}`, usuario: { id, nome, email: usuario.email, papel, lojaId } })
  }
  const cliente = clientePorEmail(alvo)
  if (!cliente || !(await senhaConfere(cliente, senha))) return fail('E-mail ou senha incorretos.', 401)
  return respond(sessaoDoCliente(cliente))
}

// Cadastro do cliente (feito no checkout). Já devolve a sessão, como o login.
// { nome, cpf, email, telefone, senha, senhaConfirmacao }
export async function cadastrarCliente(dados) {
  const cpf = somenteDigitosCpf(dados.cpf)
  const email = String(dados.email ?? '').trim().toLowerCase()
  if (!dados.nome?.trim()) return fail('Informe o nome completo.', 422)
  if (!cpfValido(cpf)) return fail('CPF inválido.', 422)
  if (!EMAIL_VALIDO.test(email)) return fail('Informe um e-mail válido.', 422)
  if (String(dados.senha ?? '').length < SENHA_MINIMA) return fail(`A senha deve ter pelo menos ${SENHA_MINIMA} caracteres.`, 422)
  if (dados.senha !== dados.senhaConfirmacao) return fail('As senhas não conferem.', 422)
  if (clientePorId(cpf)) return fail('Já existe uma conta com este CPF. Entre com o seu e-mail e senha.', 409)
  if (clientePorEmail(email) || db.usuarios.some((u) => u.email.toLowerCase() === email)) {
    return fail('Já existe uma conta com este e-mail. Entre com o seu e-mail e senha.', 409)
  }

  const cliente = {
    id: cpf,
    nome: dados.nome.trim(),
    email,
    telefone: dados.telefone?.trim() ?? '',
    clienteDesde: new Date().toISOString().slice(0, 10),
    lojaPreferidaId: null,
    papel: 'CLIENTE',
    senhaHash: await hashSenha(cpf, dados.senha),
  }
  db.clientes.push(cliente)
  return respond(sessaoDoCliente(cliente))
}

// ---------- Esqueceu a senha ----------
// Link por e-mail, válido por 30 minutos e de uso único. Vale para clientes e equipe.

const VALIDADE_LINK_MS = 30 * 60 * 1000
db.emails = db.emails ?? []
db.resetsSenha = db.resetsSenha ?? {} // token → { tabela: 'clientes' | 'usuarios', id, expiraEm }

const contaPorEmail = (email) => {
  const usuario = db.usuarios.find((u) => u.email.toLowerCase() === email)
  if (usuario) return { tabela: 'usuarios', conta: usuario }
  const cliente = clientePorEmail(email)
  return cliente ? { tabela: 'clientes', conta: cliente } : null
}

// A resposta é sempre a mesma, exista ou não a conta, para não revelar quem tem cadastro
export function solicitarNovaSenha({ email }) {
  const alvo = String(email ?? '').trim().toLowerCase()
  if (!EMAIL_VALIDO.test(alvo)) return fail('Informe um e-mail válido.', 422)
  const encontrada = contaPorEmail(alvo)
  let linkDemo = null
  if (encontrada) {
    const token = crypto.randomUUID()
    db.resetsSenha[token] = { tabela: encontrada.tabela, id: encontrada.conta.id, expiraEm: Date.now() + VALIDADE_LINK_MS }
    linkDemo = `/login/nova-senha?token=${token}`
    db.emails.push({
      para: encontrada.conta.email,
      assunto: 'Casa Lorenzi · Crie uma nova senha',
      corpo: `Recebemos um pedido para trocar a sua senha. Para criar uma nova, acesse: ${linkDemo}. O link vale por 30 minutos. Se não foi você, ignore este e-mail.`,
      enviadoEm: Date.now(),
    })
  }
  // linkDemo só existe na demonstração (simula abrir o e-mail); a API real não devolve o link
  return respond({ enviado: true, linkDemo })
}

// { token, senha, senhaConfirmacao } → define a senha nova, invalida o link e devolve o e-mail da conta
export async function redefinirSenha({ token, senha, senhaConfirmacao }) {
  const pedido = db.resetsSenha[token]
  if (!pedido || pedido.expiraEm < Date.now()) {
    delete db.resetsSenha[token]
    return fail('Este link expirou ou já foi usado. Peça um novo em "Esqueceu a senha?".', 410)
  }
  if (String(senha ?? '').length < SENHA_MINIMA) return fail(`A senha deve ter pelo menos ${SENHA_MINIMA} caracteres.`, 422)
  if (senha !== senhaConfirmacao) return fail('As senhas não conferem.', 422)
  const conta = db[pedido.tabela].find((c) => String(c.id) === String(pedido.id))
  if (!conta) return fail('Conta não encontrada.', 404)
  conta.senhaHash = await hashSenha(String(conta.id), senha)
  // Um link usado invalida os outros pendentes da mesma conta
  Object.keys(db.resetsSenha).forEach((t) => {
    if (db.resetsSenha[t].tabela === pedido.tabela && String(db.resetsSenha[t].id) === String(pedido.id)) delete db.resetsSenha[t]
  })
  return respond({ email: conta.email })
}
