import { CartaoVultoMais } from '../../components/fidelidade/CartaoVultoMais'
import { ExtratoPontos } from '../../components/fidelidade/ExtratoPontos'
import { AsyncContent } from '../../components/ui/AsyncContent'
import { useAsync } from '../../hooks/useAsync'
import { contaService } from '../../services/contaService'
import { formatCurrency } from '../../utils/format'

// Helo na área do cliente: saldo, categoria, como ganhar e usar, e o extrato
export function PontosPage() {
  const state = useAsync(() => contaService.pontos(), [])

  return (
    <>
      <div>
        <p className="eyebrow">Programa de pontos</p>
        <h1 className="client-title">Helo</h1>
        <p className="muted">Compras na Casa Lorenzi e na Vulto ganham pontos, que viram desconto no site.</p>
      </div>
      <AsyncContent state={state}>
        {(pontos) => (
          <div className="pontos-layout">
            <div className="stack">
              <CartaoVultoMais pontos={pontos} />
              <Regras regras={pontos.regras} />
            </div>
            <section className="account-card" aria-labelledby="extrato-titulo">
              <h2 id="extrato-titulo" className="section-heading__titulo">
                Extrato
              </h2>
              <ExtratoPontos extrato={pontos.extrato} />
            </section>
          </div>
        )}
      </AsyncContent>
    </>
  )
}

function Regras({ regras }) {
  const pontosPor100 = 100
  return (
    <section className="account-card pontos-regras" aria-labelledby="regras-titulo">
      <h2 id="regras-titulo" className="section-heading__titulo">
        Como funciona
      </h2>
      <ul>
        <li>
          <strong>Ganhe:</strong> {regras.pontosPorReal['Loja física']} ponto a cada R$ 1 em produtos nas lojas e {regras.pontosPorReal['E-commerce']} no
          site e no app. O frete não conta.
        </li>
        <li>
          <strong>Bônus:</strong> clientes Ouro ganham +{regras.bonusCategoria.Ouro}% e Vip +{regras.bonusCategoria.Vip}% de pontos em cada compra.
        </li>
        <li>
          <strong>Use:</strong> {pontosPor100} pontos = {formatCurrency(pontosPor100 * regras.valorPonto)} de desconto no site, em múltiplos de{' '}
          {regras.resgateMultiplo}, em compras a partir de {formatCurrency(regras.compraMinimaResgate)} em produtos.
        </li>
        <li>
          <strong>Validade:</strong> os pontos valem {regras.validadeMeses} meses; os mais antigos são usados primeiro.
        </li>
        <li>
          <strong>Categorias:</strong> Bronze até 1.500 pontos, Prata até 5.000, Ouro até 9.999 e Vip a partir de 10.000.
        </li>
      </ul>
    </section>
  )
}
