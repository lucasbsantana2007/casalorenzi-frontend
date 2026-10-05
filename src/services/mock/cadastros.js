import { db, respond } from './db'

export const listarLojas = () => respond(db.lojas)

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
