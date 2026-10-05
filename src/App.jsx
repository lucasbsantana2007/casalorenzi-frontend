import { RouterProvider } from 'react-router-dom'
import { SessionProvider } from './context/SessionProvider'
import { router } from './router'

export default function App() {
  return (
    <SessionProvider>
      <RouterProvider router={router} />
    </SessionProvider>
  )
}
