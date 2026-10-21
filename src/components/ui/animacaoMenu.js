// Animação dos menus de seleção (Select, MultiSelect e os seletores de pedido e de assunto), do
// AnimatedDropdown (emerald-ui): o menu aparece deslizando e crescendo um pouco, e as opções entram
// em sequência. Com "reduzir movimento" ligado no sistema, só o esmaecimento.

const ATRASO_ENTRE_OPCOES = 0.03 // as opções entram em sequência (até a 10ª, para listas longas não demorarem)

export function animacaoDoMenu(reduzir, paraCima = false) {
  const escondido = reduzir ? { opacity: 0 } : { opacity: 0, y: paraCima ? 10 : -10, scale: 0.95 }
  return {
    initial: escondido,
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: escondido,
    transition: { duration: reduzir ? 0 : 0.2, ease: 'easeOut' },
    style: { transformOrigin: paraCima ? 'bottom' : 'top' },
  }
}

export function animacaoDaOpcao(reduzir, indice) {
  return {
    initial: reduzir ? false : { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.2, delay: reduzir ? 0 : Math.min(indice, 10) * ATRASO_ENTRE_OPCOES },
  }
}
