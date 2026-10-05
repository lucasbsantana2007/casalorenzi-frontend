import { initials } from '../../utils/format'

export function Avatar({ name, size = 'md' }) {
  return (
    <span className={`avatar avatar--${size}`} aria-hidden="true">
      {initials(name)}
    </span>
  )
}
