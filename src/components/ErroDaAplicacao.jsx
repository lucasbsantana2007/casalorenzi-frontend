import { useRouteError } from 'react-router-dom'
import { ehArquivoDeVersaoAntiga } from '../utils/versaoNova'

// Tela de erro de qualquer rota (no lugar do "Unexpected Application Error" do React Router)
export function ErroDaAplicacao() {
  const erro = useRouteError()
  const versaoNova = ehArquivoDeVersaoAntiga(erro)
  return (
    <main className="erro-app" role="alert">
      <h1>{versaoNova ? 'O site foi atualizado' : 'Algo deu errado nesta página'}</h1>
      <p>{versaoNova ? 'Recarregue a página para continuar na versão nova.' : 'Recarregue a página. Se o problema continuar, volte para o início.'}</p>
      <div className="erro-app__acoes">
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
          Recarregar a página
        </button>
        <a href="/" className="btn btn-secondary">
          Página inicial
        </a>
      </div>
    </main>
  )
}
