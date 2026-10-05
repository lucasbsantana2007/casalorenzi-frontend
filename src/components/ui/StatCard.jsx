import { Link } from 'react-router-dom'

// tone destaca o valor quando há algo que pede atenção (warning | danger)
export function StatCard({ label, value, hint, icon: Icon, tone, to }) {
  const content = (
    <>
      <div className="stat-card__top">
        <span className="stat-card__label">{label}</span>
        {Icon && <Icon className="stat-card__icon" size={18} strokeWidth={1.6} aria-hidden="true" />}
      </div>
      <strong className={`stat-card__value ${tone ? `text-${tone}` : ''}`}>{value}</strong>
      {hint && <span className="stat-card__hint">{hint}</span>}
    </>
  )
  return to ? (
    <Link to={to} className="card stat-card stat-card--link">
      {content}
    </Link>
  ) : (
    <div className="card stat-card">{content}</div>
  )
}
