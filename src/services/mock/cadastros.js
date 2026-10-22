import { db, respond, usuarioDaSessao } from './db'

// Como a API: a equipe recebe todas (as duas marcas e o CD); o site, só as lojas físicas da marca pedida
// (sem marca, as da Casa Lorenzi)
export function listarLojas({ marca } = {}) {
  if (usuarioDaSessao()) return respond(db.lojas.filter((l) => !marca || (l.marca ?? 'LORENZI') === marca))
  return respond(db.lojas.filter((l) => (l.marca ?? 'LORENZI') === (marca || 'LORENZI') && (l.tipo ?? 'LOJA') === 'LOJA'))
}

export const listarCategorias = () => respond(db.categorias)

export const listarUsuarios = ({ papel } = {}) =>
  respond(
    db.usuarios
      .filter((u) => u.papel !== 'CLIENTE')
      .filter((u) => !papel || u.papel === papel)
      .map(({ id, nome, email, papel: p, lojaId }) => ({ id, nome, email, papel: p, lojaId })),
  )

export const listarTiposSolicitacao = () =>
  respond(db.tiposSolicitacao.filter((t) => t.ativo).sort((a, b) => a.ordemExibicao - b.ordemExibicao))
