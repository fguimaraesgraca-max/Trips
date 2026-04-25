import { CalendarDays, Map, Lightbulb, ClipboardList, ChevronUp } from 'lucide-react'

export type Tab = 'hoje' | 'roteiro' | 'dicas' | 'pendencias'

interface Props {
  active: Tab
  onChange: (t: Tab) => void
  pendingCount?: number
  tripName?: string
  tripColor?: string
  onTripTap?: () => void
}

const tabs: { id: Tab; label: string; Icon: typeof CalendarDays }[] = [
  { id: 'hoje', label: 'Hoje', Icon: CalendarDays },
  { id: 'roteiro', label: 'Roteiro', Icon: Map },
  { id: 'dicas', label: 'Dicas', Icon: Lightbulb },
  { id: 'pendencias', label: 'Pendências', Icon: ClipboardList },
]

export default function BottomNav({ active, onChange, pendingCount = 0, tripName, tripColor = '#0D9488', onTripTap }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="max-w-lg mx-auto">
        {/* Trip switcher strip */}
        {tripName && onTripTap && (
          <button
            onClick={onTripTap}
            className="w-full flex items-center justify-between px-4 py-2 border-b border-gray-100 active:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: tripColor }}
              />
              <span className="text-xs font-semibold text-gray-600 truncate">{tripName}</span>
            </div>
            <ChevronUp size={13} className="text-gray-400 flex-shrink-0 ml-2" />
          </button>
        )}

        {/* Tab buttons */}
        <div className="flex">
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors relative ${
                active === id ? 'text-indigo-600' : 'text-gray-400 active:text-gray-600'
              }`}
            >
              <Icon
                size={22}
                strokeWidth={active === id ? 2.5 : 2}
                className={active === id ? 'text-indigo-600' : 'text-gray-400'}
              />
              <span>{label}</span>
              {id === 'pendencias' && pendingCount > 0 && (
                <span className="absolute top-1.5 right-1/4 translate-x-3 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      <div style={{ height: 'env(safe-area-inset-bottom)' }} />
    </nav>
  )
}
