import { useState } from 'react'
import { Plus } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Trip, Activity } from '../types'
import { useWeather } from '../hooks/useWeather'
import WeatherCard from '../components/WeatherCard'
import ActivityItem from '../components/ActivityItem'
import TipsBalloon from '../components/TipsBalloon'
import NextStepsCard from '../components/NextStepsCard'
import EditActivityModal from '../components/EditActivityModal'

interface Props {
  trip: Trip
  todayDate: string
  tripGradient?: string
  refreshKey?: number
  onToggle: (dayId: string, actId: string) => void
  onSave: (dayId: string, act: Activity) => void
  onDelete: (dayId: string, actId: string) => void
  onMove: (fromDayId: string, toDayId: string, act: Activity) => void
  newActivity: (dayId: string) => Activity
}

export default function TodayPage({ trip, todayDate, tripGradient, refreshKey = 0, onToggle, onSave, onDelete, onMove, newActivity }: Props) {
  const [editing, setEditing] = useState<{ dayId: string; act: Activity; isNew: boolean } | null>(null)

  const todayDay = trip.days.find(d => d.date === todayDate)
  const nearestDay = todayDay ?? trip.days.find(d => d.date >= todayDate) ?? trip.days[0]

  const { weather, loading: wLoading, error: wError } = useWeather(nearestDay?.city ?? null, refreshKey)

  const completedCount = nearestDay?.activities.filter(a => a.done).length ?? 0
  const totalCount = nearestDay?.activities.length ?? 0
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  if (!nearestDay) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <p className="text-4xl mb-4">✈️</p>
        <p className="text-sm">Nenhuma viagem encontrada</p>
      </div>
    )
  }

  const isPast = nearestDay.date < todayDate
  const isToday = nearestDay.date === todayDate
  const dateLabel = isToday
    ? 'Hoje'
    : isPast
    ? format(parseISO(nearestDay.date), "EEEE, d 'de' MMMM", { locale: ptBR })
    : format(parseISO(nearestDay.date), "EEEE, d 'de' MMMM", { locale: ptBR })

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">{trip.title}</h1>
        <div className="flex items-center justify-between mt-1">
          <p className="text-sm text-white/60 capitalize">{dateLabel} · {nearestDay.city}</p>
          {!isToday && (
            <span className="text-xs bg-white/20 text-white px-2.5 py-1 rounded-full font-semibold backdrop-blur-sm">
              {isPast ? 'Passado' : 'Próxima etapa'}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div>
          <div className="flex justify-between text-xs text-white/60 mb-1">
            <span>{completedCount} de {totalCount} feitos</span>
            <span>{pct}%</span>
          </div>
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Weather */}
      {wLoading && (
        <div className="bg-[#EAF2F8] rounded-2xl h-32 flex items-center justify-center">
          <p className="text-[#5B8FAA] text-sm animate-pulse">Carregando clima...</p>
        </div>
      )}
      {wError && (
        <div className="bg-gray-50 rounded-2xl p-4 text-center text-gray-400 text-sm">
          {wError}
        </div>
      )}
      {weather && <WeatherCard weather={weather} city={nearestDay.city} gradient={tripGradient} />}

      {/* Next step reminder */}
      <NextStepsCard days={trip.days} todayDate={todayDate} />

      {/* Today's activities */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-900">
            {isToday ? "Agenda de hoje" : `Agenda — ${nearestDay.city}`}
          </h2>
          <button
            onClick={() => setEditing({ dayId: nearestDay.id, act: newActivity(nearestDay.id), isNew: true })}
            className="p-1.5 text-[#1B4F72] active:bg-[#EAF2F8] rounded-lg"
          >
            <Plus size={18} />
          </button>
        </div>

        {nearestDay.activities.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-400">
            <p className="text-3xl mb-2">📋</p>
            <p className="text-sm">Nenhuma atividade</p>
            <button
              onClick={() => setEditing({ dayId: nearestDay.id, act: newActivity(nearestDay.id), isNew: true })}
              className="mt-3 text-sm text-[#1B4F72] font-medium"
            >
              Adicionar atividade
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 px-4">
            {nearestDay.activities.map(act => (
              <ActivityItem
                key={act.id}
                activity={act}
                onToggle={() => onToggle(nearestDay.id, act.id)}
                onEdit={() => setEditing({ dayId: nearestDay.id, act, isNew: false })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Tips */}
      <TipsBalloon city={nearestDay.city} />

      {/* Bottom spacing for nav bar */}
      <div className="h-4" />

      {editing && (
        <EditActivityModal
          activity={editing.act}
          isNew={editing.isNew}
          onSave={act => onSave(editing.dayId, act)}
          onDelete={() => onDelete(editing.dayId, editing.act.id)}
          onClose={() => setEditing(null)}
          days={trip.days}
          currentDayId={editing.dayId}
          onMove={(act, toDayId) => onMove(editing.dayId, toDayId, act)}
        />
      )}
    </div>
  )
}
