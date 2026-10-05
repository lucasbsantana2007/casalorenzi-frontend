export function FormError({ error }) {
  if (!error) return null
  return (
    <p className="form-error" role="alert">
      {error.message ?? String(error)}
    </p>
  )
}
