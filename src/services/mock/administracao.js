import { criarLinkSenha } from './auth'
import { byId, clientePorEmail, db, exigirAdmin, fail, matches, mudancas, nextId, registrarLog, respond, usuarioDaSessao } from './db'

// Central administrativa (só Administrador): funcionários, lojas e log de ações.
// Toda função começa conferindo o cargo de quem está logado (na API real, pelo token).

const PAPEIS = { ADMINISTRADOR: 'Administrador', LOJISTA: 'Lojista', OPERADOR: 'Operador' }
const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const VALIDADE_CONVITE_MS = 7 * 24 * 60 * 60 * 1000

// Executa a ação só para Administrador; erros de validação viram resposta 4xx
function comoAdmin(acao) {
  try {
    exigirAdmin()
    return acao()
  } catch (error) {
    return fail(error.message, error.status ?? 400)
  }
}

const erro = (mensagem, status = 422) => Object.assign(new Error(mensagem), { status })
const nomeDaLoja = (lojaId) => byId(db.lojas, lojaId)?.nome ?? 'Todas as lojas'

// ---------- Funcionários ----------

function funcionarioView(u) {
  const loja = u.lojaId ? byId(db.lojas, u.lojaId) : null
  return {
    id: u.id,
    nome: u.nome,
    email: u.email,
    papel: u.papel,
    lojaId: u.lojaId ?? null,
    loja: loja ? { id: loja.id, nome: loja.nome } : null,
    ativo: u.ativo !== false,
    convitePendente: Boolean(u.convitePendente),
  }
}

const adminsAtivos = (excetoId) => db.usuarios.filter((u) => u.papel === 'ADMINISTRADOR' && u.ativo !== false && u.id !== excetoId)

function validarFuncionario({ nome, email, papel, lojaId }, id = null) {
  if (!nome?.trim()) throw erro('Informe o nome.')
  const alvo = String(email ?? '').trim().toLowerCase()
  if (!EMAIL_VALIDO.test(alvo)) throw erro('Informe um e-mail válido.')
  if (db.usuarios.some((u) => u.id !== id && u.email.toLowerCase() === alvo) || clientePorEmail(alvo)) throw erro('Este e-mail já está em uso.', 409)
  if (!PAPEIS[papel]) throw erro('Selecione o cargo.')
  // Lojista e Operador trabalham numa loja; o Administrador governa a rede toda
  if (papel !== 'ADMINISTRADOR' && !byId(db.lojas, lojaId)) throw erro('Selecione a loja deste funcionário.')
  return { nome: nome.trim(), email: alvo, papel, lojaId: papel === 'ADMINISTRADOR' ? null : Number(lojaId) }
}

const ROTULOS_FUNCIONARIO = { nome: 'Nome', email: 'E-mail', papel: 'Cargo', lojaId: 'Loja' }
const FORMATOS_FUNCIONARIO = { papel: (v) => PAPEIS[v] ?? '—', lojaId: (v) => (v ? nomeDaLoja(v) : '—') }

export function listarFuncionarios({ busca, papel, lojaId, status } = {}) {
  return comoAdmin(() =>
    respond(
      db.usuarios
        .map(funcionarioView)
        .filter((f) => !papel || f.papel === papel)
        .filter((f) => !lojaId || f.lojaId === Number(lojaId))
        .filter((f) => !status || (status === 'ATIVO' ? f.ativo : !f.ativo))
        .filter((f) => matches(busca, f.nome, f.email))
        .sort((a, b) => Number(b.ativo) - Number(a.ativo) || a.nome.localeCompare(b.nome)),
    ),
  )
}

// → { funcionario, linkDemo }. O funcionário novo cria a própria senha pelo convite (link de uso único)
export function criarFuncionario(dados) {
  return comoAdmin(() => {
    const campos = validarFuncionario(dados)
    const usuario = { id: nextId(db.usuarios), ...campos, ativo: true, convitePendente: true, senhaHash: null, criadoEm: Date.now() }
    db.usuarios.push(usuario)
    const linkDemo = criarLinkSenha('usuarios', usuario.id, VALIDADE_CONVITE_MS)
    db.emails = db.emails ?? []
    db.emails.push({
      para: usuario.email,
      assunto: 'Casa Lorenzi · Crie sua senha de acesso',
      corpo: `Olá, ${usuario.nome.split(' ')[0]}. Você foi cadastrado(a) no painel da Casa Lorenzi como ${PAPEIS[usuario.papel]}. Crie sua senha em: ${linkDemo}. O link vale por 7 dias.`,
      enviadoEm: Date.now(),
    })
    registrarLog({
      area: 'FUNCIONARIOS',
      acao: 'CADASTROU',
      descricao: `Cadastrou ${usuario.nome} como ${PAPEIS[usuario.papel]}${usuario.lojaId ? ` · ${nomeDaLoja(usuario.lojaId)}` : ''}`,
      referencia: { tipo: 'funcionario', id: usuario.id },
    })
    // linkDemo só existe na demonstração (simula abrir o e-mail); a API real não devolve o link
    return respond({ funcionario: funcionarioView(usuario), linkDemo })
  })
}

export function atualizarFuncionario(id, dados) {
  return comoAdmin(() => {
    const usuario = byId(db.usuarios, id)
    if (!usuario) throw erro('Funcionário não encontrado.', 404)
    const campos = validarFuncionario(dados, usuario.id)
    if (usuario.papel === 'ADMINISTRADOR' && campos.papel !== 'ADMINISTRADOR' && usuario.ativo !== false && !adminsAtivos(usuario.id).length) {
      throw erro('É preciso manter pelo menos um Administrador ativo.')
    }
    const alteracoes = mudancas(usuario, campos, ROTULOS_FUNCIONARIO, FORMATOS_FUNCIONARIO)
    Object.assign(usuario, campos)
    if (alteracoes.length) {
      registrarLog({ area: 'FUNCIONARIOS', acao: 'EDITOU', descricao: `Editou o cadastro de ${usuario.nome}`, alteracoes, referencia: { tipo: 'funcionario', id: usuario.id } })
    }
    return respond(funcionarioView(usuario))
  })
}

// { ativo: boolean }. Desativado não entra mais no painel
export function alterarStatusFuncionario(id, { ativo }) {
  return comoAdmin(() => {
    const usuario = byId(db.usuarios, id)
    if (!usuario) throw erro('Funcionário não encontrado.', 404)
    if (!ativo && usuario.id === usuarioDaSessao()?.id) throw erro('Você não pode desativar a sua própria conta.')
    if (!ativo && usuario.papel === 'ADMINISTRADOR' && !adminsAtivos(usuario.id).length) throw erro('É preciso manter pelo menos um Administrador ativo.')
    if ((usuario.ativo !== false) === Boolean(ativo)) return respond(funcionarioView(usuario))
    usuario.ativo = Boolean(ativo)
    registrarLog({
      area: 'FUNCIONARIOS',
      acao: ativo ? 'REATIVOU' : 'DESATIVOU',
      descricao: `${ativo ? 'Reativou' : 'Desativou'} o acesso de ${usuario.nome}`,
      referencia: { tipo: 'funcionario', id: usuario.id },
    })
    return respond(funcionarioView(usuario))
  })
}

// Novo convite para quem ainda não criou a senha → { linkDemo }
export function reenviarConvite(id) {
  return comoAdmin(() => {
    const usuario = byId(db.usuarios, id)
    if (!usuario?.convitePendente) throw erro('Este funcionário já criou a senha.')
    const linkDemo = criarLinkSenha('usuarios', usuario.id, VALIDADE_CONVITE_MS)
    registrarLog({ area: 'FUNCIONARIOS', acao: 'REENVIOU', descricao: `Reenviou o convite de acesso para ${usuario.nome}`, referencia: { tipo: 'funcionario', id: usuario.id } })
    return respond({ linkDemo })
  })
}

// ---------- Lojas ----------

function lojaView(loja) {
  return {
    ...loja,
    funcionariosAtivos: db.usuarios.filter((u) => u.lojaId === loja.id && u.ativo !== false).length,
    pecasEmEstoque: db.estoques.filter((e) => e.lojaId === loja.id).reduce((soma, e) => soma + e.quantidade, 0),
  }
}

function validarLoja({ nome, cidade, uf, endereco, telefone, horarios, ativa }, id = null) {
  if (!nome?.trim()) throw erro('Informe o nome da loja.')
  if (db.lojas.some((l) => l.id !== id && l.nome.toLowerCase() === nome.trim().toLowerCase())) throw erro('Já existe uma loja com este nome.', 409)
  if (!cidade?.trim()) throw erro('Informe a cidade.')
  if (!UFS.includes(uf)) throw erro('Selecione o estado.')
  return {
    nome: nome.trim(),
    cidade: cidade.trim(),
    uf,
    endereco: endereco?.trim() ?? '',
    telefone: telefone?.trim() ?? '',
    horarios: (horarios ?? []).map((h) => h.trim()).filter(Boolean),
    ativa: ativa !== false,
  }
}

const ROTULOS_LOJA = { nome: 'Nome', cidade: 'Cidade', uf: 'Estado', endereco: 'Endereço', telefone: 'Telefone', horarios: 'Horários', ativa: 'Ativa' }
const FORMATOS_LOJA = { ativa: (v) => (v ? 'Sim' : 'Não') }

export function listarLojas() {
  return comoAdmin(() => respond(db.lojas.map(lojaView).sort((a, b) => Number(b.ativa) - Number(a.ativa) || a.nome.localeCompare(b.nome))))
}

// Loja nova já nasce com estoque zerado de todas as variações (para receber transferências)
export function criarLoja(dados) {
  return comoAdmin(() => {
    const loja = { id: nextId(db.lojas), ...validarLoja(dados) }
    db.lojas.push(loja)
    db.variacoes.forEach((v) => {
      db.estoques.push({ id: nextId(db.estoques), lojaId: loja.id, variacaoId: v.id, quantidade: 0, quantidadeMin: 2, atualizadoEm: Date.now() })
    })
    registrarLog({ area: 'LOJAS', acao: 'CADASTROU', descricao: `Cadastrou a loja ${loja.nome} (${loja.cidade}, ${loja.uf})`, referencia: { tipo: 'loja', id: loja.id } })
    return respond(lojaView(loja))
  })
}

export function atualizarLoja(id, dados) {
  return comoAdmin(() => {
    const loja = byId(db.lojas, id)
    if (!loja) throw erro('Loja não encontrada.', 404)
    const campos = validarLoja(dados, loja.id)
    const alteracoes = mudancas(loja, campos, ROTULOS_LOJA, FORMATOS_LOJA)
    const nomeAnterior = loja.nome
    Object.assign(loja, campos)
    if (alteracoes.length) {
      const status = alteracoes.some((a) => a.campo === 'Ativa') ? (campos.ativa ? ' e reativou' : ' e desativou') : ''
      registrarLog({ area: 'LOJAS', acao: 'EDITOU', descricao: `Editou${status} a loja ${nomeAnterior}`, alteracoes, referencia: { tipo: 'loja', id: loja.id } })
    }
    return respond(lojaView(loja))
  })
}

// ---------- Log de ações ----------

// filtros: { area, usuarioId, busca }. Mais recentes primeiro; no máximo 500 registros
export function listarLog({ area, usuarioId, busca } = {}) {
  return comoAdmin(() =>
    respond(
      db.logs
        .filter((l) => !area || l.area === area)
        .filter((l) => !usuarioId || l.usuarioId === Number(usuarioId))
        .map((l) => {
          const usuario = byId(db.usuarios, l.usuarioId)
          return { ...l, usuario: usuario ? { id: usuario.id, nome: usuario.nome, papel: usuario.papel } : null }
        })
        .filter((l) => matches(busca, l.descricao, l.usuario?.nome, ...l.alteracoes.map((a) => a.campo)))
        .sort((a, b) => b.criadoEm - a.criadoEm)
        .slice(0, 500),
    ),
  )
}
