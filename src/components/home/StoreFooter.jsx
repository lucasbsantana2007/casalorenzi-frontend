import { Link } from 'react-router-dom'

const ANO = new Date().getFullYear()

// Rodapé da vitrine. O acesso da equipe fica aqui, de forma discreta.
export function StoreFooter() {
  return (
    <footer className="store-footer">
      <div className="store-container store-footer__grid">
        <div>
          <strong className="store-footer__brand">Casa Lorenzi</strong>
          <p>Alfaiataria, linho e tricô em quatro lojas: São Paulo, Rio de Janeiro e Curitiba.</p>
        </div>
        <div>
          <h4>Atendimento</h4>
          <Link to="/cliente/solicitacoes/nova">Abrir solicitação</Link>
          <Link to="/cliente/solicitacoes">Minhas solicitações</Link>
          <Link to="/cliente/pedidos">Consultar pedido</Link>
        </div>
        <div>
          <h4>Conta</h4>
          <Link to="/login">Minha conta</Link>
          <a href="#lojas">Nossas lojas</a>
        </div>
      </div>
      <div className="store-container store-footer__bottom">
        <span>© {ANO} Casa Lorenzi</span>
        <Link to="/login" className="store-footer__staff">
          Acesso da equipe
        </Link>
      </div>
    </footer>
  )
}
