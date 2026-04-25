import { useEffect, useState } from 'react'

interface Props {
  onContinue: () => void
}

export default function WelcomePage({ onContinue }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  const fade = (delay = 0) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(28px)',
    transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
  })

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-between overflow-hidden select-none"
      style={{ background: 'linear-gradient(160deg, #1B4F72 0%, #163F5C 50%, #0E2A40 100%)' }}
    >
      {/* Top arc decoration */}
      <div className="absolute top-0 left-0 right-0 opacity-10 pointer-events-none">
        <svg viewBox="0 0 400 140" preserveAspectRatio="none" className="w-full h-36">
          <path d="M0 0 Q200 120 400 0 L400 0 L0 0 Z" fill="white" />
        </svg>
      </div>

      {/* Centre content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center z-10 gap-0">
        {/* Logo */}
        <div style={fade(0)} className="mb-8">
          <div className="w-28 h-28 mx-auto rounded-3xl shadow-2xl overflow-hidden border-4 border-white/30">
            <img
              src={`${import.meta.env.BASE_URL}icon.svg`}
              alt="Viaticum"
              className="w-full h-full"
            />
          </div>
        </div>

        {/* App name */}
        <div style={fade(150)}>
          <h1 className="text-5xl font-bold text-white tracking-tight">Viaticum</h1>
          <p className="text-white/60 text-sm mt-1 font-light">por Filipe &amp; Patrícia</p>
        </div>

        {/* Welcome message */}
        <div style={fade(350)} className="mt-10">
          <p className="text-white/90 text-lg leading-relaxed">
            Sejam bem-vindos às
          </p>
          <p className="text-white text-2xl font-bold leading-snug mt-1">
            melhores viagens<br />da sua vida ✨
          </p>
        </div>

        {/* CTA button */}
        <div style={fade(600)} className="mt-14">
          <button
            onClick={onContinue}
            className="bg-white text-[#1B4F72] font-bold text-lg px-14 py-4 rounded-2xl shadow-2xl active:scale-95"
            style={{ transition: 'transform 0.1s' }}
          >
            ✈️&nbsp; Começar
          </button>
        </div>
      </div>

      {/* Bottom dune waves */}
      <div className="w-full pointer-events-none">
        <svg viewBox="0 0 400 90" preserveAspectRatio="none" className="w-full h-20">
          <path d="M0 45 Q100 25 200 45 Q300 65 400 45 L400 90 L0 90 Z" fill="rgba(255,255,255,0.09)" />
          <path d="M0 60 Q100 40 200 60 Q300 80 400 60 L400 90 L0 90 Z" fill="rgba(255,255,255,0.06)" />
        </svg>
      </div>
    </div>
  )
}
