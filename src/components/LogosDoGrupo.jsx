import { MARCAS } from '../data/marcas'

// As duas marcas juntas (Administrador do grupo e área do cliente): Casa Lorenzi | Vulto, separadas
// por um traço fino. claro: versões brancas, para fundo escuro
export function LogosDoGrupo({ claro = false, className = '' }) {
  return (
    <span className={`logos-grupo ${claro ? 'logos-grupo--claro' : ''} ${className}`}>
      <img src={claro ? MARCAS.LORENZI.logoBranca : MARCAS.LORENZI.logo} alt="Casa Lorenzi" className="logos-grupo__lorenzi" />
      <span className="logos-grupo__traco" aria-hidden="true" />
      <img src={claro ? MARCAS.VULTO.logoBranca : MARCAS.VULTO.logo} alt="Vulto" className="logos-grupo__vulto" />
    </span>
  )
}
