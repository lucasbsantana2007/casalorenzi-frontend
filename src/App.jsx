import { RouterProvider } from 'react-router-dom'
import { SacolaProvider } from './context/SacolaProvider'
import { SessionProvider } from './context/SessionProvider'
import { router } from './router'

export default function App() {
  return (
    <SessionProvider>
      <SacolaProvider>
        <RouterProvider router={router} />
      </SacolaProvider>
    </SessionProvider>
  )
}
