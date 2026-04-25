import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { useRegisterSW } from 'virtual:pwa-register/react'
import './index.css'
import App from './App'

function Root() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW()

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
