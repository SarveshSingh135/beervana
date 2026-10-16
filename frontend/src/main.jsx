import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

import App from './App.jsx'
import AdminDashboard from './AdminDashboard.jsx'

const currentPath = window.location.pathname

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {currentPath === '/admin' ? (
      <AdminDashboard />
    ) : (
      <App />
    )}
  </StrictMode>,
)