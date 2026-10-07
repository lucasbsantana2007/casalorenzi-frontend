// CPF: guardado só com os 11 dígitos (é o id do cliente); exibido com máscara.

export const somenteDigitosCpf = (valor) => String(valor ?? '').replace(/\D/g, '').slice(0, 11)

export function formatarCpf(valor) {
  const d = somenteDigitosCpf(valor)
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2')
}

function digitoVerificador(base) {
  const soma = [...base].reduce((total, d, i) => total + Number(d) * (base.length + 1 - i), 0)
  const resto = (soma * 10) % 11
  return resto === 10 ? 0 : resto
}

export function cpfValido(valor) {
  const d = somenteDigitosCpf(valor)
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false
  return digitoVerificador(d.slice(0, 9)) === Number(d[9]) && digitoVerificador(d.slice(0, 10)) === Number(d[10])
}
