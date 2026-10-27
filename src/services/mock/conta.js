import { getUsuarioSalvo } from '../authStorage'
import { hashSenha, SENHA_MINIMA, senhaConfere } from './auth'
import { clientePorEmail, clientePorId, db, fail, respond } from './db'
import { resumo } from './fidelidade'

// Configurações da conta do cliente. Na API real, o cliente vem do token; aqui, da sessão salva.
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SENHA_INCORRETA = 'A senha atual está incorreta.'

function clienteDaSessao() {
  const sessao = getUsuarioSalvo()
  return sessao?.papel === 'CLIENTE' ? clientePorId(sessao.id) : null
}

const semSessao = () => fail('Entre na sua conta de cliente para continuar.', 401)

const contaView = (c) => ({ id: c.id, nome: c.nome, email: c.email, cpf: c.id, telefone: c.telefone ?? '', clienteDesde: c.clienteDesde ?? null })

// Lupe+ do cliente logado: { saldo, valorEmReais, categoria, bonus, aVencer, extrato, regras }
export function pontos() {
  const cliente = clienteDaSessao()
  return cliente ? respond(resumo(cliente.id)) : semSessao()
}

export function obter() {
  const cliente = clienteDaSessao()
  return cliente ? respond(contaView(cliente)) : semSessao()
}

// { nome, email, telefone, senhaAtual? }
export async function atualizar({ nome, email, telefone, senhaAtual }) {
  const cliente = clienteDaSessao()
  if (!cliente) return semSessao()
  const alvo = String(email ?? '').trim().toLowerCase()
  if (!nome?.trim()) return fail('Informe o nome completo.', 422)
  if (!EMAIL_VALIDO.test(alvo)) return fail('Informe um e-mail válido.', 422)
  if (alvo !== cliente.email.toLowerCase()) {
    if (!senhaAtual) return fail('Para trocar o e-mail, confirme com a sua senha atual.', 422)
    if (!(await senhaConfere(cliente, senhaAtual))) return fail(SENHA_INCORRETA, 422)
    const outro = clientePorEmail(alvo)
    if ((outro && outro !== cliente) || db.usuarios.some((u) => u.email.toLowerCase() === alvo)) return fail('Já existe uma conta com este e-mail.', 409)
  }
  Object.assign(cliente, { nome: nome.trim(), email: alvo, telefone: telefone?.trim() ?? '' })
  return respond(contaView(cliente))
}

// { senhaAtual, senha, senhaConfirmacao }
export async function trocarSenha({ senhaAtual, senha, senhaConfirmacao }) {
  const cliente = clienteDaSessao()
  if (!cliente) return semSessao()
  if (!(await senhaConfere(cliente, senhaAtual))) return fail(SENHA_INCORRETA, 422)
  if (String(senha ?? '').length < SENHA_MINIMA) return fail(`A nova senha deve ter pelo menos ${SENHA_MINIMA} caracteres.`, 422)
  if (senha !== senhaConfirmacao) return fail('As senhas não conferem.', 422)
  if (await senhaConfere(cliente, senha)) return fail('A nova senha deve ser diferente da atual.', 422)
  cliente.senhaHash = await hashSenha(String(cliente.id), senha)
  return respond(null)
}

// { senha }. Apaga os dados pessoais; pedidos e solicitações ficam, anônimos, ligados a um id novo
// (o CPF, que aqui é o id, fica livre para uma conta nova)
export async function excluir({ senha }) {
  const cliente = clienteDaSessao()
  if (!cliente) return semSessao()
  if (!(await senhaConfere(cliente, senha))) return fail('Senha incorreta. Confirme com a sua senha para excluir a conta.', 422)
  const idAntigo = cliente.id
  const idNovo = `excluido-${idAntigo}-${Date.now()}`
  db.pedidos.forEach((p) => p.clienteId === idAntigo && (p.clienteId = idNovo))
  db.atendimentos.forEach((a) => a.clienteId === idAntigo && (a.clienteId = idNovo))
  db.mensagens.forEach((m) => m.autorTipo === 'CLIENTE' && m.autorId === idAntigo && (m.autorId = idNovo))
  Object.assign(cliente, {
    id: idNovo,
    nome: 'Cliente excluído',
    email: `${idNovo}@contas-excluidas.invalid`,
    telefone: null,
    senhaHash: null,
    lojaPreferidaId: null,
    excluido: true,
  })
  return respond(null)
}

// "Avise-me quando chegar", sacola guardada e preferência de e-mails (na API real ficam no banco; aqui, na memória)
const avisos = new Map()

export function avisosEstoque() {
  const cliente = clienteDaSessao()
  return cliente ? respond({ variacaoIds: [...(avisos.get(cliente.id) ?? [])] }) : semSessao()
}

export function pedirAviso(variacaoId) {
  const cliente = clienteDaSessao()
  if (!cliente) return semSessao()
  const lista = avisos.get(cliente.id) ?? new Set()
  lista.add(variacaoId)
  avisos.set(cliente.id, lista)
  return respond({ variacaoIds: [...lista] })
}

export function cancelarAviso(variacaoId) {
  const cliente = clienteDaSessao()
  if (!cliente) return semSessao()
  avisos.get(cliente.id)?.delete(variacaoId)
  return respond(null)
}

// Sem lembrete por e-mail nos mocks: a sacola fica só no navegador
export function sacola() {
  return clienteDaSessao() ? respond({ itens: [] }) : semSessao()
}

export function salvarSacola() {
  return clienteDaSessao() ? respond(null) : semSessao()
}

export function preferencias() {
  const cliente = clienteDaSessao()
  return cliente ? respond({ aceitaMarketing: Boolean(cliente.aceitaMarketing) }) : semSessao()
}

export function salvarPreferencias(aceitaMarketing) {
  const cliente = clienteDaSessao()
  if (!cliente) return semSessao()
  cliente.aceitaMarketing = Boolean(aceitaMarketing)
  return respond({ aceitaMarketing: cliente.aceitaMarketing })
}
