import { formatDateTime } from '../../utils/format'
import { Avatar } from '../ui/Avatar'
import { AnexoImagem } from './AnexoImagem'

// Histórico de mensagens. `perspectiva` define qual lado é "nosso" (alinhado à direita).
export function MessageThread({ mensagens, perspectiva = 'ATENDENTE', nomeCliente }) {
  return (
    <ol className="thread">
      {mensagens.map((m) => {
        if (m.autorTipo === 'SISTEMA') {
          return (
            <li key={m.id} className="thread__system">
              <span>{m.conteudo}</span>
              <time>{formatDateTime(m.enviadoEm)}</time>
            </li>
          )
        }
        const nome = m.autorTipo === 'CLIENTE' ? nomeCliente : perspectiva === 'CLIENTE' ? `${m.autor?.nome ?? 'Equipe'} · Casa Lorenzi` : m.autor?.nome ?? 'Equipe'
        return (
          <li key={m.id} className={`thread__message ${m.autorTipo === perspectiva ? 'is-own' : ''}`}>
            <Avatar name={m.autorTipo === 'CLIENTE' ? nomeCliente : m.autor?.nome ?? 'Casa Lorenzi'} size="sm" />
            <div className="thread__bubble">
              <div className="thread__meta">
                <strong>{nome}</strong>
                <time>{formatDateTime(m.enviadoEm)}</time>
              </div>
              <p>{m.conteudo}</p>
              {m.anexo && <AnexoImagem anexo={m.anexo} />}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
