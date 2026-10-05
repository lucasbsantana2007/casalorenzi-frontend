import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

// Executa uma função assíncrona (normalmente um serviço) e expõe data/loading/error.
// Reexecuta quando `deps` mudam e descarta respostas de requisições já obsoletas.
export function useAsync(asyncFn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const [version, setVersion] = useState(0)
  const fnRef = useRef(asyncFn)

  useLayoutEffect(() => {
    fnRef.current = asyncFn
  })

  useEffect(() => {
    let active = true
    setState((prev) => ({ ...prev, loading: true, error: null }))
    fnRef
      .current()
      .then((data) => active && setState({ data, loading: false, error: null }))
      .catch((error) => active && setState({ data: null, loading: false, error }))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version])

  const reload = useCallback(() => setVersion((v) => v + 1), [])
  const setData = useCallback((data) => setState((prev) => ({ ...prev, data })), [])

  return { ...state, reload, setData }
}
