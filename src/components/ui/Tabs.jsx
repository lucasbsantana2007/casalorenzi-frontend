import { NavLink } from 'react-router-dom'

// Abas por estado local. items: [{ value, label, count? }]
export function Tabs({ items, value, onChange, label }) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          role="tab"
          aria-selected={value === item.value}
          className={`tabs__item ${value === item.value ? 'is-active' : ''}`}
          onClick={() => onChange(item.value)}
        >
          {item.label}
          {item.count !== undefined && <span className="tabs__count">{item.count}</span>}
        </button>
      ))}
    </div>
  )
}

// Abas que são rotas. items: [{ to, label, end? }]
export function NavTabs({ items, label }) {
  return (
    <nav className="tabs" aria-label={label}>
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `tabs__item ${isActive ? 'is-active' : ''}`}>
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
