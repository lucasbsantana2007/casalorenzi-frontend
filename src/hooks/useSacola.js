import { useContext } from 'react'
import { SacolaContext } from '../context/sacolaContext'

export function useSacola() {
  const sacola = useContext(SacolaContext)
  if (!sacola) throw new Error('useSacola deve ser usado dentro de <SacolaProvider>.')
  return sacola
}
