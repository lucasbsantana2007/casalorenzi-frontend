export function BrandMark({ subtitle, inverse = false }) {
  return (
    <span className={`brand ${inverse ? 'brand--inverse' : ''}`}>
      <span className="brand__name">Casa Lorenzi</span>
      {subtitle && <span className="brand__subtitle">{subtitle}</span>}
    </span>
  )
}
