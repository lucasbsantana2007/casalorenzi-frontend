import { Link } from 'react-router-dom'

const ANO = new Date().getFullYear()

// Rodapé mínimo. O acesso da equipe fica aqui, discreto.
export function StoreFooter() {
  return (
    <footer className="store-footer">
      <nav className="store-footer__links" aria-label="Rodapé">
        <Link to="/cliente/solicitacoes">Atendimento</Link>
        <Link to="/cliente/pedidos">Consultar pedido</Link>
        <Link to="/lojas">Lojas</Link>
        <Link to="/login">Conta</Link>
      </nav>
      <div className="store-footer__bottom">
        <span>© {ANO} Casa Lorenzi</span>
        <Link to="/login/equipe" className="store-footer__staff">
          Acesso da equipe
        </Link>
      </div>
    </footer>
  )
}
