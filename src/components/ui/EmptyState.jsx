import { Inbox } from 'lucide-react'

export function EmptyState({ icon: Icon = Inbox, title = 'Nada por aqui', description, action }) {
  return (
    <div className="state state--empty">
      <Icon size={28} strokeWidth={1.4} aria-hidden="true" />
      <strong>{title}</strong>
      {description && <p>{description}</p>}
      {action}
    </div>
  )
}
