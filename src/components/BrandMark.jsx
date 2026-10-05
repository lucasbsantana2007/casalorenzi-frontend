import logo from '../assets/logo-casa-lorenzi.png'
import logoClaro from '../assets/logo-casa-lorenzi-claro.png'

// inverse: versão clara do logo, para fundos escuros (sidebar)
export function BrandMark({ subtitle, inverse = false, size = 'md' }) {
  return (
    <span className={`brand brand--${size} ${inverse ? 'brand--inverse' : ''}`}>
      <img src={inverse ? logoClaro : logo} alt="Casa Lorenzi" className="brand__logo" />
      {subtitle && <span className="brand__subtitle">{subtitle}</span>}
    </span>
  )
}
