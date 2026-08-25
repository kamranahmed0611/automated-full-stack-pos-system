import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e2024',
            color: '#f0f1f3',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#0e0f11' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#0e0f11' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
