import { Bell, BellOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Activity, Day } from '../types'

interface Props {
  days: Day[]
  todayDate: string
}

function getNextActivity(days: Day[], todayDate: string): { day: Day; activity: Activity } | null {
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)

  for (const day of days) {
    if (day.date < todayDate) continue
    for (const act of day.activities) {
      if (act.done) continue
      if (day.date > todayStr) return { day, activity: act }
      const [h, m] = act.time.split(':').map(Number)
      const actTime = new Date(now)
      actTime.setHours(h, m, 0, 0)
      if (actTime > now) return { day, activity: act }
    }
  }
  return null
}

function diffLabel(date: string, time: string): string {
  const now = new Date()
  const [h, m] = time.split(':').map(Number)
  const target = new Date(date + 'T00:00:00')
  target.setHours(h, m)
  const diffMs = target.getTime() - now.getTime()
  if (diffMs < 0) return 'Passou'
  const diffMin = Math.round(diffMs / 60000)
  if (diffMin < 60) return `em ${diffMin}min`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `em ${diffH}h`
  const diffD = Math.round(diffH / 24)
  return `em ${diffD} dia${diffD > 1 ? 's' : ''}`
}

export default function NextStepsCard({ days, todayDate }: Props) {
  const [notifGranted, setNotifGranted] = useState(false)
  const next = getNextActivity(days, todayDate)

  useEffect(() => {
    setNotifGranted(
      typeof Notification !== 'undefined' && Notification.permission === 'granted'
    )
  }, [])

  const requestNotifications = async () => {
    if (typeof Notification === 'undefined') return
    const perm = await Notification.requestPermission()
    setNotifGranted(perm === 'granted')
    if (perm === 'granted' && next) {
      const { day, activity } = next
      const [h, m] = activity.time.split(':').map(Number)
      const target = new Date(day.date + 'T00:00:00')
      target.setHours(h - 1, m) // 1h before
      const delay = target.getTime() - Date.now()
      if (delay > 0) {
        setTimeout(() => {
          new Notification('Próxima atividade! ✈️', {
            body: `${activity.time} — ${activity.title}`,
            icon: '/icon-192.png',
          })
        }, delay)
      }
    }
  }

  if (!next) return null

  const { day, activity } = next
  const diff = diffLabel(day.date, activity.time)
  const isUrgent = diff.includes('min') || diff.includes('1h')

  return (
    <div className={`rounded-2xl p-4 ${isUrgent ? 'bg-amber-50 border border-amber-200' : 'bg-white border border-gray-100 shadow-sm'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-semibold uppercase tracking-wide ${isUrgent ? 'text-amber-600' : 'text-gray-500'}`}>
            {isUrgent ? '⚡ Logo logo' : '🔜 Próximo passo'}
          </p>
          <p className="text-base font-semibold text-gray-900 mt-1 truncate">{activity.title}</p>
          <p className="text-sm text-gray-500 mt-0.5">
            {activity.time} · {new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
          </p>
          {activity.location && (
            <p className="text-xs text-gray-400 mt-1 truncate">📍 {activity.location}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 ml-3">
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${isUrgent ? 'bg-amber-200 text-amber-800' : 'bg-indigo-50 text-indigo-600'}`}>
            {diff}
          </span>
          <button
            onClick={requestNotifications}
            className="p-1 text-gray-400 active:text-indigo-600"
            title={notifGranted ? 'Notificações ativas' : 'Ativar lembretes'}
          >
            {notifGranted ? <Bell size={16} className="text-indigo-500" /> : <BellOff size={16} />}
          </button>
        </div>
      </div>
    </div>
  )
}
