import { useState } from 'react'
import { useTrip } from './hooks/useTrip'
import BottomNav, { Tab } from './components/BottomNav'
import TodayPage from './pages/TodayPage'
import ItineraryPage from './pages/ItineraryPage'
import TipsPage from './pages/TipsPage'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function App() {
  const [tab, setTab] = useState<Tab>('hoje')
  const {
    trip,
    toggleActivity,
    saveActivity,
    deleteActivity,
    addDay,
    deleteDay,
    updateTripTitle,
    newActivity,
  } = useTrip()

  const today = todayISO()

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-lg mx-auto overflow-y-auto">
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
      </div>
      <BottomNav active={tab} onChange={setTab} />
    </div>
  )
}
