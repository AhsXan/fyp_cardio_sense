/**
 * Application Entry Point
 * - Initializes React app and mounts to DOM
 * - Wraps with BrowserRouter for routing support
 * - Applies StrictMode for development warnings
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// Mount React app to #app element in index.html
createRoot(document.getElementById('app')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

