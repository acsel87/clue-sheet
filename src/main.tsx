import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import './index.css'

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return

  const { registerSW } = await import('virtual:pwa-register')

  registerSW({
    immediate: true,
    onRegisterError(error: unknown) {
      console.error('Service worker registration error:', error)
    },
  })
}

registerServiceWorker()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
