import { CalendarDays, Map, Lightbulb, ClipboardList, Globe } from 'lucide-react'

export type Tab = 'hoje' | 'roteiro' | 'dicas' | 'pendencias'
type NavItem = Tab | 'viagens'

interface Props {
  active: Tab
  onChange: (t: NavItem) => void
  pendingCount?: number
  tripColor?: string
}

const tabs: { id: NavItem; label: string; Icon: typeof CalendarDays }[] = [
  { id: 'hoje', label: 'Hoje', Icon: CalendarDays },
  { id: 'roteiro', label: 'Roteiro', Icon: Map },
  { id: 'dicas', label: 'Dicas', Icon: Lightbulb },
  { id: 'pendencias', label: 'Pendências', Icon: ClipboardList },
  { id: 'viagens', label: 'Viagens', Icon: Globe },
]

export default function BottomNav({ active, onChange, pendingCount = 0, tripColor = '#1B4F72' }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="max-w-lg mx-auto">
        <div className="flex">
          {tabs.map(({ id, label, Icon }) => {
            const isActive = active === id
            return (
              <button
                key={id}
                onClick={() => onChange(id)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors relative ${
                  isActive ? 'text-[#1B4F72]' : 'text-gray-400 active:text-gray-600'
                }`}
              >
                <div className="relative">
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={isActive ? 'text-[#1B4F72]' : 'text-gray-400'}
                  />
                  {id === 'viagens' && (
                    <span
                      className="absolute -top-0.5 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white"
                      style={{ background: tripColor }}
                    />
                  )}
                </div>
                <span>{label}</span>
                {id === 'pendencias' && pendingCount > 0 && (
                  <span className="absolute top-1.5 right-1/4 translate-x-3 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
      <div style={{ height: 'env(safe-area-inset-bottom)' }} />
    </nav>
  )
}
