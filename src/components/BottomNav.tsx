import { CalendarDays, Map, Lightbulb } from 'lucide-react'

export type Tab = 'hoje' | 'roteiro' | 'dicas'

interface Props {
  active: Tab
  onChange: (t: Tab) => void
}

const tabs: { id: Tab; label: string; Icon: typeof CalendarDays }[] = [
  { id: 'hoje', label: 'Hoje', Icon: CalendarDays },
  { id: 'roteiro', label: 'Roteiro', Icon: Map },
  { id: 'dicas', label: 'Dicas', Icon: Lightbulb },
]

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom">
      <div className="flex">
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors ${
              active === id
                ? 'text-indigo-600'
                : 'text-gray-400 active:text-gray-600'
            }`}
          >
            <Icon
              size={22}
              strokeWidth={active === id ? 2.5 : 2}
              className={active === id ? 'text-indigo-600' : 'text-gray-400'}
            />
            <span>{label}</span>
          </button>
        ))}
      </div>
      {/* iOS safe area */}
      <div className="h-safe-bottom" />
    </nav>
  )
}
