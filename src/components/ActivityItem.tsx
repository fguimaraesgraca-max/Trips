import { Pencil, Plane, Hotel, UtensilsCrossed, Landmark, Car, ShoppingBag, Circle, MapPin } from 'lucide-react'
import { Activity, ActivityType } from '../types'

const TYPE_CONFIG: Record<ActivityType, { icon: typeof Plane; color: string; bg: string }> = {
  flight:     { icon: Plane,           color: 'text-sky-600',     bg: 'bg-sky-50'    },
  hotel:      { icon: Hotel,           color: 'text-purple-600',  bg: 'bg-purple-50' },
  food:       { icon: UtensilsCrossed, color: 'text-amber-600',   bg: 'bg-amber-50'  },
  attraction: { icon: Landmark,        color: 'text-emerald-600', bg: 'bg-emerald-50'},
  transport:  { icon: Car,             color: 'text-gray-600',    bg: 'bg-gray-100'  },
  shopping:   { icon: ShoppingBag,     color: 'text-pink-600',    bg: 'bg-pink-50'   },
  other:      { icon: Circle,          color: 'text-gray-500',    bg: 'bg-gray-100'  },
}

function mapsSearchUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

function mapsDirectionsUrl(origin: string, destination: string) {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=transit`
}

// Detect "A → B" or "A -> B" patterns in title/description for directions
function extractRoute(text: string): { origin: string; dest: string } | null {
  const m = text.match(/^(.+?)\s*(?:→|->|➜)\s*(.+)$/)
  if (!m) return null
  return { origin: m[1].trim(), dest: m[2].trim() }
}

interface Props {
  activity: Activity
  onToggle: () => void
  onEdit: () => void
}

export default function ActivityItem({ activity, onToggle, onEdit }: Props) {
  const { icon: Icon, color, bg } = TYPE_CONFIG[activity.type]
  const isNav = activity.type === 'transport' || activity.type === 'flight'

  // Build the best Maps link for this activity
  const mapsUrl = (() => {
    if (!activity.location && !isNav) return null
    // Transport/flight: try to extract route from title for directions
    if (isNav) {
      const route = extractRoute(activity.title) || extractRoute(activity.description)
      if (route) return mapsDirectionsUrl(route.origin, route.dest)
      if (activity.location) return mapsSearchUrl(activity.location)
    }
    if (activity.location) return mapsSearchUrl(activity.location)
    return null
  })()

  const mapsLabel = (() => {
    if (isNav) {
      const route = extractRoute(activity.title) || extractRoute(activity.description)
      if (route) return 'Rota no Maps'
    }
    return 'Ver no Maps'
  })()

  return (
    <div className={`flex items-start gap-3 py-3 px-1 ${activity.done ? 'opacity-50' : ''}`}>
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={`mt-0.5 w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
          activity.done ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300 active:border-indigo-400'
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
          <button onClick={onEdit} className="p-1.5 text-gray-400 active:text-indigo-600 flex-shrink-0 -mt-0.5">
            <Pencil size={14} />
          </button>
        </div>

        {activity.description && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">{activity.description}</p>
        )}

        {/* Location + Maps link */}
        {activity.location && (
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <p className="text-xs text-gray-400 truncate flex-1">📍 {activity.location}</p>
            {!activity.done && (
              <a
                href={mapsSearchUrl(activity.location)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 flex items-center gap-0.5 text-xs text-sky-500 font-semibold active:opacity-60"
              >
                <MapPin size={10} />Maps
              </a>
            )}
          </div>
        )}

        {/* Directions link for transport/flight with route */}
        {!activity.done && isNav && mapsUrl && !activity.location && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-sky-500 font-semibold mt-1 active:opacity-60"
          >
            <MapPin size={10} />
            {mapsLabel} →
          </a>
        )}

        {/* Notes (color by type) */}
        {activity.notes && !activity.done && (
          <div className={`text-xs rounded px-2 py-1.5 mt-1.5 ${
            activity.type === 'flight'     ? 'text-sky-800 bg-sky-50'
            : activity.type === 'hotel'   ? 'text-purple-800 bg-purple-50'
            : activity.type === 'transport'? 'text-gray-700 bg-gray-100'
            : 'text-amber-700 bg-amber-50'
          }`}>
            <span className="mr-1">
              {activity.type === 'flight' ? '✈️' : activity.type === 'hotel' ? '🏨' : activity.type === 'transport' ? '🚌' : '💡'}
            </span>
            {activity.notes}
          </div>
        )}
      </div>
    </div>
  )
}
