import { Pencil, Plane, Hotel, UtensilsCrossed, Landmark, Car, ShoppingBag, Circle } from 'lucide-react'
import { Activity, ActivityType } from '../types'

const TYPE_CONFIG: Record<ActivityType, { icon: typeof Plane; color: string; bg: string }> = {
  flight: { icon: Plane, color: 'text-sky-600', bg: 'bg-sky-50' },
  hotel: { icon: Hotel, color: 'text-purple-600', bg: 'bg-purple-50' },
  food: { icon: UtensilsCrossed, color: 'text-amber-600', bg: 'bg-amber-50' },
  attraction: { icon: Landmark, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  transport: { icon: Car, color: 'text-gray-600', bg: 'bg-gray-100' },
  shopping: { icon: ShoppingBag, color: 'text-pink-600', bg: 'bg-pink-50' },
  other: { icon: Circle, color: 'text-gray-500', bg: 'bg-gray-100' },
}

interface Props {
  activity: Activity
  onToggle: () => void
  onEdit: () => void
}

export default function ActivityItem({ activity, onToggle, onEdit }: Props) {
  const { icon: Icon, color, bg } = TYPE_CONFIG[activity.type]

  return (
    <div className={`flex items-start gap-3 py-3 px-1 ${activity.done ? 'opacity-50' : ''}`}>
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={`mt-0.5 w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
          activity.done
            ? 'bg-indigo-500 border-indigo-500'
            : 'border-gray-300 active:border-indigo-400'
        }`}
      >
        {activity.done && (
          <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
            <path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Type icon */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}>
        <Icon size={16} className={color} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={`text-sm font-semibold text-gray-900 leading-snug ${activity.done ? 'line-through' : ''}`}>
              {activity.title || 'Sem título'}
            </p>
            {activity.time && (
              <span className="text-xs text-indigo-600 font-medium">{activity.time}</span>
            )}
          </div>
          <button
            onClick={onEdit}
            className="p-1.5 text-gray-400 active:text-indigo-600 flex-shrink-0 -mt-0.5"
          >
            <Pencil size={14} />
          </button>
        </div>
        {activity.description && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">{activity.description}</p>
        )}
        {activity.location && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">📍 {activity.location}</p>
        )}
        {activity.notes && !activity.done && (
          <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 mt-1.5">
            💡 {activity.notes}
          </p>
        )}
      </div>
    </div>
  )
}
