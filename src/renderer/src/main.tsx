import './main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import App from './App'
import { ErrorLog } from './components/ErrorLog'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
      <ErrorLog />
    </HashRouter>
  </StrictMode>
)
