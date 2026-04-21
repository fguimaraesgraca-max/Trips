import { useState } from 'react'
import { Plus, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Trip, Activity, Day } from '../types'
import ActivityItem from '../components/ActivityItem'
import EditActivityModal from '../components/EditActivityModal'
import { useTripWeather, DayWeatherMap } from '../hooks/useWeather'
import { getWeatherEmoji } from '../utils/weather'

interface Props {
  trip: Trip
  todayDate: string
  onToggle: (dayId: string, actId: string) => void
  onSave: (dayId: string, act: Activity) => void
  onDelete: (dayId: string, actId: string) => void
  onDeleteDay: (dayId: string) => void
  onAddDay: (date: string, city: string, country: string) => void
  newActivity: (dayId: string) => Activity
  onUpdateTitle: (title: string) => void
  weatherMap?: DayWeatherMap
}

function AddDayModal({ onAdd, onClose }: { onAdd: (d: string, c: string, co: string) => void; onClose: () => void }) {
  const [date, setDate] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('Portugal')

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl">
        <div className="px-4 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Adicionar dia</h2>
        </div>
        <div className="px-4 py-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Data</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cidade</label>
            <input
              type="text"
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="ex: Lisboa"
              className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">País</label>
            <input
              type="text"
              value={country}
              onChange={e => setCountry(e.target.value)}
              placeholder="ex: Portugal"
              className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="px-4 pb-8 flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-200 py-3 rounded-xl text-sm font-medium text-gray-700">
            Cancelar
          </button>
          <button
            onClick={() => { if (date && city) { onAdd(date, city, country); onClose() } }}
            disabled={!date || !city}
            className="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-50"
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  )
}

function DayCard({
  day,
  todayDate,
  onToggle,
  onSave,
  onDelete,
  onDeleteDay,
  newActivity,
  weather,
}: {
  day: Day
  todayDate: string
  onToggle: (actId: string) => void
  onSave: (act: Activity) => void
  onDelete: (actId: string) => void
  onDeleteDay: () => void
  newActivity: () => Activity
  weather?: { min: number; max: number; code: number }
}) {
  const isToday = day.date === todayDate
  const isPast = day.date < todayDate
  const [open, setOpen] = useState(!isPast || isToday)
  const [editing, setEditing] = useState<{ act: Activity; isNew: boolean } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const done = day.activities.filter(a => a.done).length
  const total = day.activities.length

  return (
    <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${isToday ? 'border-indigo-200' : 'border-gray-100'}`}>
      {/* Day header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start justify-between px-4 py-3.5 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isToday && <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full font-medium">Hoje</span>}
            {isPast && !isToday && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Passado</span>}
            <p className="text-sm font-semibold text-gray-900 capitalize truncate">
              {format(parseISO(day.date), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <p className="text-xs text-gray-500">
              {day.city}, {day.country}
              {total > 0 && ` · ${done}/${total}`}
            </p>
            {weather && (
              <span className="text-xs text-gray-500 flex items-center gap-0.5">
                {getWeatherEmoji(weather.code)}
                <span className="font-medium text-gray-700">{weather.max}°</span>
                <span className="text-gray-400">/ {weather.min}°</span>
              </span>
            )}
          </div>
          {total > 0 && (
            <div className="h-1 bg-gray-100 rounded-full mt-2 overflow-hidden w-32">
              <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${(done / total) * 100}%` }} />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 ml-2 mt-0.5">
          {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>

      {open && (
        <>
          <div className="divide-y divide-gray-50 px-4 border-t border-gray-50">
            {day.activities.map(act => (
              <ActivityItem
                key={act.id}
                activity={act}
                onToggle={() => onToggle(act.id)}
                onEdit={() => setEditing({ act, isNew: false })}
              />
            ))}
            {day.activities.length === 0 && (
              <p className="py-4 text-sm text-gray-400 text-center">Nenhuma atividade</p>
            )}
          </div>

          <div className="flex gap-2 px-4 py-3 border-t border-gray-50">
            <button
              onClick={() => setEditing({ act: newActivity(), isNew: true })}
              className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium py-2 px-3 bg-indigo-50 rounded-xl active:bg-indigo-100"
            >
              <Plus size={14} /> Atividade
            </button>
            <div className="flex-1" />
            <button
              onClick={() => { if (!confirmDelete) { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 3000) } else { onDeleteDay() } }}
              className={`flex items-center gap-1.5 text-xs font-medium py-2 px-3 rounded-xl ${
                confirmDelete ? 'bg-red-600 text-white' : 'text-red-400 active:bg-red-50'
              }`}
            >
              <Trash2 size={14} />
              {confirmDelete ? 'Confirmar exclusão' : 'Excluir dia'}
            </button>
          </div>
        </>
      )}

      {editing && (
        <EditActivityModal
          activity={editing.act}
          isNew={editing.isNew}
          onSave={onSave}
          onDelete={() => onDelete(editing.act.id)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

export default function ItineraryPage({
  trip,
  todayDate,
  onToggle,
  onSave,
  onDelete,
  onDeleteDay,
  onAddDay,
  newActivity,
  onUpdateTitle,
}: Props) {
  const [addingDay, setAddingDay] = useState(false)
  const weatherMap = useTripWeather(trip.days)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleVal, setTitleVal] = useState(trip.title)

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Trip title */}
      <div className="flex items-center gap-2">
        {editingTitle ? (
          <input
            autoFocus
            value={titleVal}
            onChange={e => setTitleVal(e.target.value)}
            onBlur={() => { onUpdateTitle(titleVal); setEditingTitle(false) }}
            onKeyDown={e => { if (e.key === 'Enter') { onUpdateTitle(titleVal); setEditingTitle(false) } }}
            className="text-xl font-bold text-gray-900 bg-transparent border-b-2 border-indigo-500 outline-none flex-1"
          />
        ) : (
          <h1
            onClick={() => setEditingTitle(true)}
            className="text-xl font-bold text-gray-900 flex-1 cursor-pointer active:opacity-70"
          >
            {trip.title}
          </h1>
        )}
      </div>

      <p className="text-xs text-gray-400 -mt-2">Toque no título para editar</p>

      {/* Days */}
      {trip.days.map(day => (
        <DayCard
          key={day.id}
          day={day}
          todayDate={todayDate}
          onToggle={actId => onToggle(day.id, actId)}
          onSave={act => onSave(day.id, act)}
          onDelete={actId => onDelete(day.id, actId)}
          onDeleteDay={() => onDeleteDay(day.id)}
          newActivity={() => newActivity(day.id)}
          weather={weatherMap[`${day.city}:${day.date}`]}
        />
      ))}

      {/* Add day */}
      <button
        onClick={() => setAddingDay(true)}
        className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-4 text-sm text-gray-400 font-medium flex items-center justify-center gap-2 active:border-indigo-300 active:text-indigo-500"
      >
        <Plus size={18} /> Adicionar dia
      </button>

      <div className="h-4" />

      {addingDay && (
        <AddDayModal onAdd={onAddDay} onClose={() => setAddingDay(false)} />
      )}
    </div>
  )
}
