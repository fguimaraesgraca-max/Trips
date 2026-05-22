import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { useRegisterSW } from 'virtual:pwa-register/react'
import './index.css'
import App from './App'

declare const __BUILD_ID__: string

// On every new deploy, wipe all old service workers and caches, then reload
// so the user always gets a fresh bundle with the embedded API key.
const STORED_BUILD = localStorage.getItem('viaticum-build-id')
if (STORED_BUILD !== __BUILD_ID__) {
  localStorage.setItem('viaticum-build-id', __BUILD_ID__)
  Promise.all([
    navigator.serviceWorker?.getRegistrations().then(regs =>
      Promise.all(regs.map(r => r.unregister()))
    ),
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    ),
  ]).then(() => window.location.reload())
}

function Root() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW()

  // Also auto-reload when a new service worker takes control
  useEffect(() => {
    const handler = () => window.location.reload()
    navigator.serviceWorker?.addEventListener('controllerchange', handler)
    return () => navigator.serviceWorker?.removeEventListener('controllerchange', handler)
  }, [])

  return (
    <>
      <App />
      {needRefresh && (
        <div
          className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between gap-3 px-4 py-3 bg-[#1B4F72] text-white text-sm font-medium shadow-lg"
          style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}
        >
          <span>🔄 Nova versão disponível</span>
          <button
            onClick={() => updateServiceWorker(true)}
            className="bg-white text-[#163F5C] text-xs font-bold px-3 py-1.5 rounded-lg active:opacity-80"
          >
            Atualizar
          </button>
        </div>
      )}
    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>
)
