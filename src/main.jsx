import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { destinoPendente } from './router'
import { recarregarVersaoNova } from './utils/versaoNova'
import './styles/base.css'
import './styles/components.css'
import './styles/layout.css'
import './styles/pages.css'
import './styles/login.css'
import './styles/store.css'
import './styles/checkout.css'
import './styles/marcas.css'
import './styles/painel-marcas.css'

// Arquivo da versão anterior que não existe mais (deploy novo com a aba aberta): recarrega uma vez
window.addEventListener('vite:preloadError', (evento) => {
  if (recarregarVersaoNova(destinoPendente())) evento.preventDefault()
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
