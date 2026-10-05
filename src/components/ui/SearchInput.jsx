import { Search } from 'lucide-react'

export function SearchInput({ value, onChange, placeholder = 'Buscar…', label = 'Buscar' }) {
  return (
    <div className="search-input">
      <Search size={16} aria-hidden="true" />
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={label} />
    </div>
  )
}
