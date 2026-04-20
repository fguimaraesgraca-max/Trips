import { useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { useTrip } from './hooks/useTrip'
import BottomNav, { Tab } from './components/BottomNav'
import TodayPage from './pages/TodayPage'
import ItineraryPage from './pages/ItineraryPage'
import TipsPage from './pages/TipsPage'
import PendenciasPage from './pages/PendenciasPage'
import { Trip } from './types'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function TripSwitcher({
  trips,
  activeId,
  onChange,
}: {
  trips: Trip[]
  activeId: string
  onChange: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const current = trips.find(t => t.id === activeId) ?? trips[0]

  if (trips.length <= 1) {
    return (
      <div className="flex items-center justify-center px-4 py-2 border-b border-gray-100 bg-white">
        <p className="text-sm font-semibold text-gray-700">{current.title}</p>
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 border-b border-gray-100 bg-white"
      >
        <span className="text-sm font-semibold text-gray-700">{current.title}</span>
        <ChevronDown size={14} className="text-gray-400" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-t-2xl">
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Minhas viagens</h2>
              <button onClick={() => setOpen(false)}>
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="px-4 py-3 space-y-2">
              {trips.map(t => (
                <button
                  key={t.id}
                  onClick={() => { onChange(t.id); setOpen(false) }}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border text-left transition-colors ${
                    t.id === activeId
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white border-gray-100 text-gray-900 active:bg-gray-50'
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold">{t.title}</p>
                    <p className={`text-xs mt-0.5 ${t.id === activeId ? 'text-indigo-200' : 'text-gray-400'}`}>
                      {t.days.length} dias
                      {t.pendingItems.filter(p => p.status === 'pendente').length > 0 &&
                        ` · ${t.pendingItems.filter(p => p.status === 'pendente').length} pendência${t.pendingItems.filter(p => p.status === 'pendente').length > 1 ? 's' : ''}`}
                    </p>
                  </div>
                  {t.id === activeId && (
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Ativa</span>
                  )}
                </button>
              ))}
            </div>
            <div className="pb-8" />
          </div>
        </div>
      )}
    </>
  )
}

export default function App() {
  const [tab, setTab] = useState<Tab>('hoje')
  const {
    trips,
    activeTripId,
    trip,
    setActiveTrip,
    toggleActivity,
    saveActivity,
    deleteActivity,
    addDay,
    deleteDay,
    updateTripTitle,
    newActivity,
    togglePending,
    savePendingItem,
    deletePendingItem,
    newPendingItem,
  } = useTrip()

  const today = todayISO()
  const pendingCount = trip.pendingItems.filter(p => p.status === 'pendente').length

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-lg mx-auto">
        <TripSwitcher trips={trips} activeId={activeTripId} onChange={setActiveTrip} />

        <div className="overflow-y-auto">
          {tab === 'hoje' && (
            <TodayPage
              trip={trip}
              todayDate={today}
              onToggle={toggleActivity}
              onSave={saveActivity}
              onDelete={deleteActivity}
              newActivity={newActivity}
            />
          )}
          {tab === 'roteiro' && (
            <ItineraryPage
              trip={trip}
              todayDate={today}
              onToggle={toggleActivity}
              onSave={saveActivity}
              onDelete={deleteActivity}
              onDeleteDay={deleteDay}
              onAddDay={addDay}
              newActivity={newActivity}
              onUpdateTitle={updateTripTitle}
            />
          )}
          {tab === 'dicas' && (
            <TipsPage trip={trip} />
          )}
          {tab === 'pendencias' && (
            <PendenciasPage
              items={trip.pendingItems}
              onToggle={togglePending}
              onSave={savePendingItem}
              onDelete={deletePendingItem}
              newItem={newPendingItem}
            />
          )}
        </div>
      </div>

      <BottomNav active={tab} onChange={setTab} pendingCount={pendingCount} />
    </div>
  )
}
