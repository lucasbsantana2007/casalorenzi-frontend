export function CheckboxLine({ checked, onChange, children }) {
  return (
    <label className="checkbox-line">
      <span className="checkbox-line__box">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M3 6.2 5 8.1 9 3.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span>{children}</span>
    </label>
  )
}
