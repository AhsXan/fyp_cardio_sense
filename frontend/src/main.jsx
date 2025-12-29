import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// MSW is disabled - using real backend API
// To re-enable MSW, uncomment the code below and set USE_MOCK_API=true in .env

// Initialize app without MSW
createRoot(document.getElementById('app')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

