import { useState, Component, ReactNode } from 'react'
import { X, Plus, Check, Map, Pencil, Trash2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useTrip } from './hooks/useTrip'
import BottomNav, { Tab } from './components/BottomNav'
import TodayPage from './pages/TodayPage'
import ItineraryPage from './pages/ItineraryPage'
import TipsPage from './pages/TipsPage'
import PendenciasPage from './pages/PendenciasPage'
import WelcomePage from './pages/WelcomePage'
import { Trip, Day } from './types'
import { parseItineraryText } from './utils/parseItinerary'

// ─── Error Boundary ───────────────────────────────────────────────────────────
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      const err = this.state.error as Error
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ background: '#FAF6ED' }}>
          <p className="text-4xl mb-4">⚠️</p>
          <p className="text-gray-900 font-semibold mb-2">Algo deu errado</p>
          <p className="text-gray-500 text-sm mb-6 max-w-xs">{err.message}</p>
          <button
            onClick={() => { localStorage.removeItem('viaticum-v2'); window.location.reload() }}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold"
          >
            Reiniciar app
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function todayISO() { return new Date().toISOString().slice(0, 10) }

function tripGradient(trip: Trip): string {
  const t = trip.title.toLowerCase()
  if (t.includes('lençóis') || t.includes('maranhão') || t.includes('maranhenses'))
    return 'linear-gradient(135deg,#1BB8A9,#0D9488)'
  if (t.includes('lisboa') || t.includes('porto') || t.includes('portugal'))
    return 'linear-gradient(135deg,#2980B9,#1A5276)'
  if (t.includes('paris') || t.includes('france'))
    return 'linear-gradient(135deg,#8E44AD,#6C3483)'
  if (t.includes('new york') || t.includes('eua') || t.includes('usa'))
    return 'linear-gradient(135deg,#E74C3C,#922B21)'
  if (t.includes('tokyo') || t.includes('japão') || t.includes('japan'))
    return 'linear-gradient(135deg,#E67E22,#CA6F1E)'
  return 'linear-gradient(135deg,#7F8C8D,#566573)'
}

function tripDateRange(trip: Trip): string {
  if (!trip.days.length) return 'Sem datas'
  try {
    const f = format(parseISO(trip.days[0].date), "d 'de' MMM", { locale: ptBR })
    const l = format(parseISO(trip.days[trip.days.length - 1].date), "d 'de' MMM yyyy", { locale: ptBR })
    return `${f} – ${l}`
  } catch { return '' }
}

// ─── SVG Stamp ────────────────────────────────────────────────────────────────
function Stamp({ uid, color, emoji, label, rotation = 0 }: {
  uid: string; color: string; emoji: string; label: string; rotation?: number
}) {
  const W = 42, H = 50, B = 5, R = 2.4, STEP = 7
  const maskId = `sm-${uid}`

  // Perforation hole positions along each border edge
  const holes: { x: number; y: number }[] = []
  for (let x = B + 2; x <= W - B - 2; x += STEP) {
    holes.push({ x, y: R + 0.5 })          // top
    holes.push({ x, y: H - R - 0.5 })      // bottom
  }
  for (let y = B + 2; y <= H - B - 2; y += STEP) {
    holes.push({ x: R + 0.5, y })           // left
    holes.push({ x: W - R - 0.5, y })       // right
  }

  return (
    <div
      style={{ transform: `rotate(${rotation}deg)`, flexShrink: 0, filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.35))' }}
    >
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} overflow="visible">
        <defs>
          <mask id={maskId}>
            {/* Start white = show everything */}
            <rect x={0} y={0} width={W} height={H} rx={2} fill="white" />
            {/* Black circles = punch holes */}
            {holes.map((h, i) => <circle key={i} cx={h.x} cy={h.y} r={R} fill="black" />)}
          </mask>
        </defs>

        {/* Coloured stamp face (behind the white frame) */}
        <rect x={B} y={B} width={W - 2 * B} height={H - 2 * B} fill={color} rx={1.5} />

        {/* White paper frame with perforated holes cut out via mask */}
        <rect x={0} y={0} width={W} height={H} rx={2} fill="white" mask={`url(#${maskId})`} />

        {/* Emoji */}
        <text x={W / 2} y={H / 2 - 2} textAnchor="middle" dominantBaseline="middle" fontSize={17}>
          {emoji}
        </text>

        {/* Label */}
        <text
          x={W / 2} y={H - B - 2.5}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={5} fill="rgba(255,255,255,0.92)"
          fontWeight="bold" fontFamily="system-ui, sans-serif"
          letterSpacing="0.7"
        >
          {label.toUpperCase()}
        </text>
      </svg>
    </div>
  )
}

// ─── Trip Banner ──────────────────────────────────────────────────────────────
const STAMPS = [
  { color: '#27AE60', emoji: '🌊', label: 'Água',      rotation: -5 },
  { color: '#E67E22', emoji: '✈️', label: 'Voo',       rotation:  3 },
  { color: '#E74C3C', emoji: '❤️', label: 'Amor',      rotation: -3 },
  { color: '#2980B9', emoji: '⭐', label: 'Estrelas',   rotation:  5 },
  { color: '#D4AC0D', emoji: '🧳', label: 'Viagem',    rotation: -2 },
  { color: '#8E44AD', emoji: '🌅', label: 'Memória',   rotation:  4 },
]

function TripBanner() {
  return (
    <div
      className="w-full px-4 pt-4 pb-3 flex items-center justify-between gap-3"
      style={{ background: 'linear-gradient(135deg,#0D9488 0%,#0A6B60 100%)' }}
    >
      {/* Left: app identity */}
      <div className="flex-shrink-0">
        <p className="text-white font-bold text-xl tracking-tight leading-none">Viaticum</p>
        <p className="text-white/55 text-[11px] mt-0.5 font-light">por Filipe &amp; Patrícia</p>
      </div>

      {/* Right: stamps row */}
      <div className="flex items-end gap-1.5 overflow-x-auto scrollbar-hide pr-1" style={{ paddingBottom: 4 }}>
        {STAMPS.map((s, i) => (
          <Stamp key={i} uid={String(i)} color={s.color} emoji={s.emoji} label={s.label} rotation={s.rotation} />
        ))}
      </div>
    </div>
  )
}

// ─── Trip Switcher FAB (bottom-left) ──────────────────────────────────────────
function TripSwitcherFab({ trip, onClick }: { trip: Trip; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed left-3 z-40 flex items-center gap-2 bg-white rounded-2xl pl-2.5 pr-3 py-2 shadow-lg border border-gray-100 active:scale-95 transition-transform"
      style={{ bottom: 'calc(64px + env(safe-area-inset-bottom))' }}
    >
      {/* Coloured dot matching trip gradient */}
      <div
        className="w-5 h-5 rounded-lg flex-shrink-0"
        style={{ background: tripGradient(trip) }}
      />
      <span className="text-[11px] font-semibold text-gray-700 max-w-[110px] truncate leading-none">
        {trip.title}
      </span>
      <Map size={12} className="text-gray-400 flex-shrink-0" />
    </button>
  )
}

// ─── Create Trip Modal ────────────────────────────────────────────────────────
function CreateTripModal({
  onClose,
  onCreate,
  onCreateWithDays,
}: {
  onClose: () => void
  onCreate: (title: string, city: string, country: string, date: string) => void
  onCreateWithDays: (title: string, days: Day[]) => void
}) {
  const [mode, setMode] = useState<'manual' | 'text'>('manual')
  const [title, setTitle] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('Brasil')
  const [date, setDate] = useState(todayISO())
  const [rawText, setRawText] = useState('')
  const [parsed, setParsed] = useState<{ days: number; acts: number } | null>(null)

  function handleParse() {
    const days = parseItineraryText(rawText)
    if (days.length > 0) {
      setParsed({ days: days.length, acts: days.reduce((s, d) => s + d.activities.length, 0) })
    }
  }

  function handle() {
    if (mode === 'text') {
      if (!title.trim() || !parsed) return
      onCreateWithDays(title.trim(), parseItineraryText(rawText))
      onClose()
    } else {
      if (!title.trim() || !city.trim() || !date) return
      onCreate(title.trim(), city.trim(), country.trim() || 'Brasil', date)
      onClose()
    }
  }

  const inputCls = 'mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white'
  const labelCls = 'text-xs font-semibold text-gray-500 uppercase tracking-wide'

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl max-h-[92vh] flex flex-col" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Nova viagem</h2>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>

        {/* Tab toggle */}
        <div className="px-5 pt-4 flex-shrink-0">
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setMode('manual')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'manual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              ✏️ Campos manuais
            </button>
            <button
              onClick={() => setMode('text')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'text' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              📋 Colar roteiro
            </button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">
          {/* Trip name always visible */}
          <div>
            <label className={labelCls}>Nome da viagem *</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="ex: Europa Inverno 2027" className={inputCls} />
          </div>

          {mode === 'manual' ? (
            <>
              <div>
                <label className={labelCls}>Primeira cidade *</label>
                <input value={city} onChange={e => setCity(e.target.value)}
                  placeholder="ex: Barcelona" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>País</label>
                <input value={country} onChange={e => setCountry(e.target.value)}
                  placeholder="ex: Espanha" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Data de partida *</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className={inputCls} />
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Cole seu roteiro aqui</label>
                <p className="text-xs text-gray-400 mt-0.5 mb-1.5">
                  Inclua datas, horários, voos, hotéis, cidades e atividades. O app detecta e organiza automaticamente.
                </p>
                <textarea
                  value={rawText}
                  onChange={e => { setRawText(e.target.value); setParsed(null) }}
                  placeholder={
                    '14/05 - São Paulo\n18h Voo GRU → AMS LATAM\n\n15/05 - Amsterdam\n11:00 Chegada Schiphol\n15:00 Check-in hotel\n18h Passeio Jordaan\n\n20/05 - Bruges\n15:00 Hotel Biskajer - Check-in'
                  }
                  className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white resize-none font-mono"
                  rows={10}
                />
              </div>
              <button
                onClick={handleParse}
                disabled={rawText.trim().length < 10}
                className="w-full border-2 border-indigo-500 text-indigo-600 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 active:bg-indigo-50"
              >
                🔍 Organizar roteiro
              </button>
              {parsed && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="text-emerald-800 text-sm font-bold">Roteiro organizado!</p>
                    <p className="text-emerald-600 text-xs mt-0.5">{parsed.days} dias · {parsed.acts} atividades detectadas</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-5 pb-6 pt-3 flex-shrink-0 border-t border-gray-100">
          <button
            onClick={handle}
            disabled={mode === 'manual' ? (!title.trim() || !city.trim() || !date) : (!title.trim() || !parsed)}
            className="w-full bg-indigo-600 text-white py-3.5 rounded-2xl text-base font-bold disabled:opacity-40"
          >
            {mode === 'text' ? '🗺️ Criar viagem com roteiro' : 'Criar viagem'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Edit Trip Modal ──────────────────────────────────────────────────────────
function EditTripModal({
  trip,
  canDelete,
  onClose,
  onUpdate,
  onDelete,
}: {
  trip: Trip
  canDelete: boolean
  onClose: () => void
  onUpdate: (id: string, title: string) => void
  onDelete: (id: string) => void
}) {
  const [title, setTitle] = useState(trip.title)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function handleSave() {
    if (!title.trim()) return
    onUpdate(trip.id, title.trim())
    onClose()
  }

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    onDelete(trip.id)
    onClose()
  }

  const inputCls =
    'mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white'
  const labelCls = 'text-xs font-semibold text-gray-500 uppercase tracking-wide'

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Editar viagem</h2>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <div className="px-5 py-5 space-y-4">
          <div>
            <label className={labelCls}>Nome da viagem *</label>
            <input
              value={title}
              onChange={e => { setTitle(e.target.value); setConfirmDelete(false) }}
              placeholder="Nome da viagem"
              className={inputCls}
            />
          </div>
        </div>
        <div className="px-5 pb-6 pt-2 space-y-3">
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="w-full bg-indigo-600 text-white py-3.5 rounded-2xl text-base font-bold disabled:opacity-40"
          >
            Salvar
          </button>
          {canDelete && (
            <button
              onClick={handleDelete}
              className={`w-full py-3.5 rounded-2xl text-base font-bold flex items-center justify-center gap-2 transition-colors ${
                confirmDelete
                  ? 'bg-red-600 text-white'
                  : 'bg-red-50 text-red-600'
              }`}
            >
              <Trash2 size={18} />
              {confirmDelete ? 'Confirmar exclusão' : 'Excluir viagem'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Trip Menu (full-screen) ──────────────────────────────────────────────────
function TripMenu({
  trips,
  activeId,
  onChange,
  onClose,
  onCreateTrip,
  onCreateTripWithDays,
  onUpdateTrip,
  onDeleteTrip,
}: {
  trips: Trip[]
  activeId: string
  onChange: (id: string) => void
  onClose: () => void
  onCreateTrip: (title: string, city: string, country: string, date: string) => void
  onCreateTripWithDays: (title: string, days: Day[]) => void
  onUpdateTrip: (id: string, title: string) => void
  onDeleteTrip: (id: string) => void
}) {
  const [creating, setCreating] = useState(false)
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null)

  return (
    <>
      <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#FAF6ED' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-14 pb-4 bg-white border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Minhas Viagens</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {trips.length} viagem{trips.length !== 1 ? 's' : ''} guardada{trips.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"
          >
            <X size={18} className="text-gray-600" />
          </button>
        </div>

        {/* Trip cards */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {trips.map(t => {
            const isActive = t.id === activeId
            const pending = t.pendingItems.filter(p => p.status === 'pendente').length
            return (
              <div
                key={t.id}
                className="w-full rounded-3xl overflow-hidden shadow-md"
              >
                {/* Gradient top — tap to activate */}
                <button
                  onClick={() => { onChange(t.id); onClose() }}
                  className="w-full text-left px-5 pt-5 pb-4 flex items-start justify-between active:opacity-80 transition-opacity"
                  style={{ background: tripGradient(t) }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white/70 text-xs font-medium mb-1">{tripDateRange(t)}</p>
                    <h3 className="text-white font-bold text-lg leading-tight">{t.title}</h3>
                    <p className="text-white/70 text-sm mt-1">
                      {t.days.length} dia{t.days.length !== 1 ? 's' : ''}
                      {t.days[0] ? ` · ${t.days[0].city}` : ''}
                      {pending > 0 ? ` · ${pending} pendência${pending !== 1 ? 's' : ''}` : ''}
                    </p>
                  </div>
                  {isActive && (
                    <div className="ml-3 mt-1 w-8 h-8 rounded-full bg-white/25 flex items-center justify-center flex-shrink-0">
                      <Check size={16} className="text-white" strokeWidth={3} />
                    </div>
                  )}
                </button>

                {/* White footer — status + edit button */}
                <div className="bg-white px-5 py-3 flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}>
                    {isActive ? '✓ Viagem ativa' : 'Toque para ativar'}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); setEditingTrip(t) }}
                    className="flex items-center gap-1.5 text-gray-500 hover:text-indigo-600 active:scale-90 transition-transform px-2 py-1"
                  >
                    <Pencil size={14} />
                    <span className="text-xs font-semibold">Editar</span>
                  </button>
                </div>
              </div>
            )
          })}

          {/* Add trip */}
          <button
            onClick={() => setCreating(true)}
            className="w-full border-2 border-dashed border-gray-300 rounded-3xl py-6 flex flex-col items-center gap-2 text-gray-400 active:border-indigo-400 active:text-indigo-500 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <Plus size={22} />
            </div>
            <span className="text-sm font-semibold">Adicionar nova viagem</span>
          </button>
          <div className="h-6" />
        </div>
      </div>

      {creating && (
        <CreateTripModal
          onClose={() => setCreating(false)}
          onCreate={(title, city, country, date) => {
            onCreateTrip(title, city, country, date)
            onClose()
          }}
          onCreateWithDays={(title, days) => {
            onCreateTripWithDays(title, days)
            onClose()
          }}
        />
      )}

      {editingTrip && (
        <EditTripModal
          trip={editingTrip}
          canDelete={trips.length > 1}
          onClose={() => setEditingTrip(null)}
          onUpdate={(id, title) => { onUpdateTrip(id, title); setEditingTrip(null) }}
          onDelete={(id) => { onDeleteTrip(id); setEditingTrip(null) }}
        />
      )}
    </>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState<Tab>('hoje')
  const [showWelcome, setShowWelcome] = useState(
    () => !sessionStorage.getItem('viaticum-welcomed')
  )
  const [showTripMenu, setShowTripMenu] = useState(false)

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
    createTrip,
    createTripWithDays,
    updateTripMeta,
    deleteTrip,
  } = useTrip()

  const today = todayISO()
  const pendingCount = trip.pendingItems.filter(p => p.status === 'pendente').length

  if (showWelcome) {
    return (
      <ErrorBoundary>
        <WelcomePage onContinue={() => {
          sessionStorage.setItem('viaticum-welcomed', '1')
          setShowWelcome(false)
        }} />
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      {showTripMenu && (
        <TripMenu
          trips={trips}
          activeId={activeTripId}
          onChange={setActiveTrip}
          onClose={() => setShowTripMenu(false)}
          onCreateTrip={createTrip}
          onCreateTripWithDays={createTripWithDays}
          onUpdateTrip={updateTripMeta}
          onDeleteTrip={deleteTrip}
        />
      )}

      <div className="min-h-screen pb-20" style={{ background: '#FAF6ED' }}>
        <div className="max-w-lg mx-auto">
          {/* Decorative stamp banner */}
          <TripBanner />

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
            {tab === 'dicas' && <TipsPage trip={trip} />}
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
      </div>

      {/* Trip switcher FAB — bottom-left, above nav */}
      <TripSwitcherFab trip={trip} onClick={() => setShowTripMenu(true)} />

      <BottomNav active={tab} onChange={setTab} pendingCount={pendingCount} />
    </ErrorBoundary>
  )
}
