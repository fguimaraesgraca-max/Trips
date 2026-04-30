import { useState, useRef, useEffect, Component, ReactNode } from 'react'
import { X, Plus, Check, Pencil, Trash2, Share2, Upload, GripVertical } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useTrip } from './hooks/useTrip'
import { clearWeatherCache } from './hooks/useWeather'
import BottomNav, { Tab } from './components/BottomNav'
import TodayPage from './pages/TodayPage'
import ItineraryPage from './pages/ItineraryPage'
import TipsPage from './pages/TipsPage'
import PendenciasPage from './pages/PendenciasPage'
import WelcomePage from './pages/WelcomePage'
import { Trip, Day } from './types'
import { parseItineraryFull, debugParseItinerary, ParseDebug } from './utils/parseItinerary'
import { PendingItem } from './types'

// ─── Error Boundary ───────────────────────────────────────────────────────────
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      const err = this.state.error as Error
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ background: '#1B4F72' }}>
          <p className="text-4xl mb-4">⚠️</p>
          <p className="text-gray-900 font-semibold mb-2">Algo deu errado</p>
          <p className="text-gray-500 text-sm mb-6 max-w-xs">{err.message}</p>
          <button
            onClick={() => { localStorage.removeItem('viaticum-v2'); window.location.reload() }}
            className="bg-[#1B4F72] text-white px-5 py-2.5 rounded-xl text-sm font-semibold"
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

function hexDarken(hex: string, amount = 40): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amount)
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amount)
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amount)
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`
}

function tripGradient(trip: Trip): string {
  if (trip.color) {
    return `linear-gradient(135deg,${trip.color},${hexDarken(trip.color)})`
  }
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
  return 'linear-gradient(135deg,#1B4F72,#0E3252)'
}

const COLOR_PRESETS = [
  '#1B4F72', '#0E3252', '#2A6B9A', '#8FA8B8',
  '#8B7355', '#6B4226', '#2D6A4F', '#6B4C8A',
  '#9B2335', '#C0392B', '#4A5568', '#1A252F',
]

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
  { color: '#1B4F72', emoji: '✈️', label: 'Voo',      rotation: -5 },
  { color: '#8FA8B8', emoji: '🌊', label: 'Mar',       rotation:  3 },
  { color: '#8B7355', emoji: '🧳', label: 'Viagem',    rotation: -3 },
  { color: '#2D6A4F', emoji: '🌿', label: 'Natureza',  rotation:  5 },
  { color: '#6B4226', emoji: '☕', label: 'Café',      rotation: -2 },
  { color: '#4A5568', emoji: '🗺️', label: 'Mapa',     rotation:  4 },
]

function TripBanner() {
  return (
    <div
      className="w-full px-4 pb-3 flex items-center justify-between gap-3"
      style={{
        background: 'linear-gradient(135deg,#1B4F72 0%,#0E3252 100%)',
        paddingTop: 'max(16px, env(safe-area-inset-top))',
      }}
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


// ─── Create Trip Modal ────────────────────────────────────────────────────────
function CreateTripModal({
  onClose,
  onCreate,
  onCreateWithDays,
}: {
  onClose: () => void
  onCreate: (title: string, city: string, country: string, date: string) => void
  onCreateWithDays: (title: string, days: Day[], pendingItems: PendingItem[]) => void
}) {
  const [mode, setMode] = useState<'manual' | 'text'>('manual')
  const [title, setTitle] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('Brasil')
  const [date, setDate] = useState(todayISO())
  const [rawText, setRawText] = useState('')
  const [parsed, setParsed] = useState<{ days: number; acts: number; pending: number } | null>(null)
  const [debugInfo, setDebugInfo] = useState<ParseDebug | null>(null)

  function handleParse() {
    setParsed(null)
    setDebugInfo(null)
    const dbg = debugParseItinerary(rawText)
    setDebugInfo(dbg)
    const result = parseItineraryFull(rawText)
    if (result.days.length > 0) {
      setParsed({
        days: result.days.length,
        acts: result.days.reduce((s, d) => s + d.activities.length, 0),
        pending: result.pendingItems.length,
      })
    }
  }

  function handle() {
    if (mode === 'text') {
      if (!title.trim() || !parsed) return
      const result = parseItineraryFull(rawText)
      onCreateWithDays(title.trim(), result.days, result.pendingItems)
      onClose()
    } else {
      if (!title.trim() || !city.trim() || !date) return
      onCreate(title.trim(), city.trim(), country.trim() || 'Brasil', date)
      onClose()
    }
  }

  const inputCls = 'mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F72] bg-white'
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
                  onChange={e => { setRawText(e.target.value); setParsed(null); setDebugInfo(null) }}
                  placeholder={
                    '14/05 - São Paulo\n18h Voo GRU → AMS LATAM\n\n15/05 - Amsterdam\n11:00 Chegada Schiphol\n15:00 Check-in hotel\n18h Passeio Jordaan\n\n20/05 - Bruges\n15:00 Hotel Biskajer - Check-in'
                  }
                  className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F72] bg-white resize-none font-mono"
                  rows={10}
                />
              </div>
              <button
                onClick={handleParse}
                disabled={rawText.trim().length < 10}
                className="w-full border-2 border-[#1B4F72] text-[#1B4F72] py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 active:bg-[#EAF2F8]"
              >
                🔍 Organizar roteiro
              </button>
              {debugInfo && parsed && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="text-emerald-800 text-sm font-bold">Roteiro organizado!</p>
                    <p className="text-emerald-600 text-xs mt-0.5">
                      {parsed.days} dias · {parsed.acts} atividades
                      {parsed.pending > 0 && ` · ${parsed.pending} pendência${parsed.pending !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                </div>
              )}
              {debugInfo && !parsed && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 space-y-2">
                  <p className="text-amber-800 text-sm font-bold">
                    {debugInfo.dateLines.length === 0
                      ? 'Nenhum cabeçalho de data encontrado'
                      : `${debugInfo.dateLines.length} data(s) detectada(s), mas sem atividades`}
                  </p>
                  <p className="text-amber-700 text-xs">
                    {debugInfo.totalLines} linhas lidas. Primeira linha: <span className="font-mono">"{debugInfo.firstLine.slice(0, 50)}"</span>
                  </p>
                  {debugInfo.dateLines.length > 0 && (
                    <p className="text-amber-700 text-xs">
                      Datas detectadas: {debugInfo.dateLines.slice(0, 3).map(d => d.date).join(', ')}
                    </p>
                  )}
                  <p className="text-amber-600 text-xs border-t border-amber-200 pt-2">
                    Formato esperado por linha de dia: <span className="font-mono font-bold">14/05</span>, <span className="font-mono font-bold">14/Mai</span> ou <span className="font-mono font-bold">14 de maio</span> — seguido das atividades abaixo.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-5 pb-6 pt-3 flex-shrink-0 border-t border-gray-100">
          <button
            onClick={handle}
            disabled={mode === 'manual' ? (!title.trim() || !city.trim() || !date) : (!title.trim() || !parsed)}
            className="w-full bg-[#1B4F72] text-white py-3.5 rounded-2xl text-base font-bold disabled:opacity-40"
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
  onUpdate: (id: string, title: string, color?: string) => void
  onDelete: (id: string) => void
}) {
  const [title, setTitle] = useState(trip.title)
  const [color, setColor] = useState<string | undefined>(trip.color)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function handleSave() {
    if (!title.trim()) return
    onUpdate(trip.id, title.trim(), color)
    onClose()
  }

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    onDelete(trip.id)
    onClose()
  }

  function handleExport() {
    const { id: _id, ...data } = trip
    const json = JSON.stringify(data, null, 2)
    if (navigator.share) {
      navigator.share({ title: `Viaticum — ${trip.title}`, text: json }).catch(() => {})
    } else {
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${trip.title.replace(/\s+/g, '_')}.viaticum.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const inputCls =
    'mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F72] bg-white'
  const labelCls = 'text-xs font-semibold text-gray-500 uppercase tracking-wide'

  const previewGradient = color
    ? `linear-gradient(135deg,${color},${hexDarken(color)})`
    : tripGradient(trip)

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Editar viagem</h2>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <div className="px-5 py-5 space-y-5">
          <div>
            <label className={labelCls}>Nome da viagem *</label>
            <input
              value={title}
              onChange={e => { setTitle(e.target.value); setConfirmDelete(false) }}
              placeholder="Nome da viagem"
              className={inputCls}
            />
          </div>

          {/* Color picker */}
          <div>
            <label className={labelCls}>Cor do banner</label>
            {/* Preview strip */}
            <div
              className="mt-2 w-full h-10 rounded-xl mb-3"
              style={{ background: previewGradient }}
            />
            {/* Preset swatches */}
            <div className="grid grid-cols-6 gap-2">
              {COLOR_PRESETS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-full aspect-square rounded-full transition-transform active:scale-90 relative"
                  style={{ background: c }}
                >
                  {(color ?? '').toLowerCase() === c.toLowerCase() && (
                    <Check
                      size={14}
                      strokeWidth={3}
                      className="absolute inset-0 m-auto text-white drop-shadow"
                    />
                  )}
                </button>
              ))}
            </div>
            {/* Custom color input */}
            <div className="mt-3 flex items-center gap-3">
              <label className="text-xs text-gray-500 shrink-0">Personalizar:</label>
              <input
                type="color"
                value={color ?? '#7F8C8D'}
                onChange={e => setColor(e.target.value)}
                className="w-10 h-8 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white"
              />
              {color && (
                <button
                  onClick={() => setColor(undefined)}
                  className="text-xs text-gray-400 underline"
                >
                  Usar padrão
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="px-5 pb-6 pt-2 space-y-3">
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="w-full bg-[#1B4F72] text-white py-3.5 rounded-2xl text-base font-bold disabled:opacity-40"
          >
            Salvar
          </button>
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-3.5 rounded-2xl text-base font-semibold"
          >
            <Share2 size={18} /> Exportar viagem
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

// ─── Import Trip Modal ────────────────────────────────────────────────────────
function ImportTripModal({
  onImport,
  onClose,
}: {
  onImport: (data: Omit<Trip, 'id'>) => void
  onClose: () => void
}) {
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setText(ev.target?.result as string ?? '')
    reader.readAsText(file)
  }

  function handleImport() {
    setError('')
    try {
      const data = JSON.parse(text)
      if (!data.title || !Array.isArray(data.days)) {
        setError('Arquivo inválido — campos obrigatórios ausentes.')
        return
      }
      onImport({ ...data, pendingItems: data.pendingItems ?? [] })
      onClose()
    } catch {
      setError('JSON inválido. Copie o conteúdo completo do arquivo exportado.')
    }
  }

  const preview = (() => {
    try {
      const d = JSON.parse(text)
      if (d.title && Array.isArray(d.days)) return `${d.title} · ${d.days.length} dia${d.days.length !== 1 ? 's' : ''}`
    } catch {}
    return null
  })()

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl max-h-[90vh] flex flex-col" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Importar viagem</h2>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <div className="px-5 py-5 space-y-4 overflow-y-auto flex-1">
          <p className="text-sm text-gray-500">
            Cole abaixo o texto exportado de outro dispositivo, ou selecione o arquivo <code className="text-xs bg-gray-100 px-1 rounded">.viaticum.json</code>.
          </p>

          {/* File picker */}
          <label className="flex items-center gap-2 w-full border border-dashed border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-500 cursor-pointer active:bg-gray-50">
            <Upload size={16} />
            <span>Selecionar arquivo</span>
            <input type="file" accept=".json,application/json" className="hidden" onChange={handleFile} />
          </label>

          <div className="text-xs text-center text-gray-400">ou cole o texto abaixo</div>

          <textarea
            value={text}
            onChange={e => { setText(e.target.value); setError('') }}
            placeholder='{"title":"Eurotrip","days":[...],"pendingItems":[...]}'
            rows={7}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#1B4F72] resize-none"
          />

          {preview && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-lg">✅</span>
              <p className="text-sm font-semibold text-emerald-800">{preview}</p>
            </div>
          )}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
          )}
        </div>
        <div className="px-5 pb-6 pt-3 flex-shrink-0 border-t border-gray-100">
          <button
            onClick={handleImport}
            disabled={!preview}
            className="w-full bg-[#1B4F72] text-white py-3.5 rounded-2xl text-base font-bold disabled:opacity-40"
          >
            Importar viagem
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Trip Menu (full-screen) ──────────────────────────────────────────────────
function reinsert<T>(arr: T[], from: number, to: number): T[] {
  const r = [...arr]
  const [item] = r.splice(from, 1)
  r.splice(to, 0, item)
  return r
}

function TripMenu({
  trips,
  activeId,
  onChange,
  onClose,
  onCreateTrip,
  onCreateTripWithDays,
  onImportTrip,
  onUpdateTrip,
  onDeleteTrip,
  onReorder,
}: {
  trips: Trip[]
  activeId: string
  onChange: (id: string) => void
  onClose: () => void
  onCreateTrip: (title: string, city: string, country: string, date: string) => void
  onCreateTripWithDays: (title: string, days: Day[], pendingItems: PendingItem[]) => void
  onImportTrip: (data: Omit<Trip, 'id'>) => void
  onUpdateTrip: (id: string, title: string, color?: string) => void
  onDeleteTrip: (id: string) => void
  onReorder: (ids: string[]) => void
}) {
  const [creating, setCreating] = useState(false)
  const [importing, setImporting] = useState(false)
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null)

  // Drag-to-reorder state
  const [orderedTrips, setOrderedTrips] = useState(trips)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const dragRef = useRef<{ startY: number; fromIndex: number } | null>(null)

  // Keep local order in sync when trips prop changes (add/delete)
  useEffect(() => {
    setOrderedTrips(prev => {
      const prevIds = new Set(prev.map(t => t.id))
      const newTrips = trips.filter(t => !prevIds.has(t.id))
      const updated = prev
        .filter(p => trips.some(t => t.id === p.id))
        .map(p => trips.find(t => t.id === p.id)!)
      return [...updated, ...newTrips]
    })
  }, [trips])

  const displayTrips = draggingId !== null && dragOverIndex !== null
    ? reinsert(orderedTrips, orderedTrips.findIndex(t => t.id === draggingId), dragOverIndex)
    : orderedTrips

  function handleGripTouchStart(e: React.TouchEvent, id: string, index: number) {
    e.stopPropagation()
    dragRef.current = { startY: e.touches[0].clientY, fromIndex: index }
    setDraggingId(id)
    setDragOverIndex(index)
  }

  function handleListTouchMove(e: React.TouchEvent) {
    if (!dragRef.current || draggingId === null) return
    const dy = e.touches[0].clientY - dragRef.current.startY
    const CARD_H = 182
    const rawIndex = dragRef.current.fromIndex + Math.round(dy / CARD_H)
    setDragOverIndex(Math.max(0, Math.min(orderedTrips.length - 1, rawIndex)))
  }

  function handleListTouchEnd() {
    if (dragRef.current && draggingId !== null && dragOverIndex !== null) {
      const from = dragRef.current.fromIndex
      if (from !== dragOverIndex) {
        const next = reinsert(orderedTrips, from, dragOverIndex)
        setOrderedTrips(next)
        onReorder(next.map(t => t.id))
      }
    }
    setDraggingId(null)
    setDragOverIndex(null)
    dragRef.current = null
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#1B4F72' }}>
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
        <div
          className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
          onTouchMove={handleListTouchMove}
          onTouchEnd={handleListTouchEnd}
        >
          {displayTrips.map((t, idx) => {
            const isActive = t.id === activeId
            const isDragging = t.id === draggingId
            const pending = t.pendingItems.filter(p => p.status === 'pendente').length
            return (
              <div
                key={t.id}
                className="w-full rounded-3xl overflow-hidden shadow-md transition-all duration-150"
                style={{
                  opacity: isDragging ? 0.6 : 1,
                  transform: isDragging ? 'scale(0.97)' : 'scale(1)',
                }}
              >
                {/* Gradient top — tap to activate */}
                <button
                  onClick={() => { if (!dragRef.current) { onChange(t.id); onClose() } }}
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

                {/* White footer — status + drag handle + edit button */}
                <div className="bg-white px-4 py-3 flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isActive ? 'text-[#1B4F72]' : 'text-gray-400'}`}>
                    {isActive ? '✓ Viagem ativa' : 'Toque para ativar'}
                  </span>
                  <div className="flex items-center gap-1">
                    {/* Drag handle */}
                    <div
                      style={{ touchAction: 'none' }}
                      onTouchStart={e => handleGripTouchStart(e, t.id, idx)}
                      className="p-2 text-gray-300 active:text-gray-500 cursor-grab"
                    >
                      <GripVertical size={16} />
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); setEditingTrip(t) }}
                      className="flex items-center gap-1.5 text-gray-500 hover:text-[#1B4F72] active:scale-90 transition-transform px-2 py-1"
                    >
                      <Pencil size={14} />
                      <span className="text-xs font-semibold">Editar</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Add / Import trip */}
          <div className="flex gap-3">
            <button
              onClick={() => setCreating(true)}
              className="flex-1 border-2 border-dashed border-white/30 rounded-3xl py-5 flex flex-col items-center gap-2 text-white/60 active:border-white/60 active:text-white transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <Plus size={20} />
              </div>
              <span className="text-xs font-semibold">Nova viagem</span>
            </button>
            <button
              onClick={() => setImporting(true)}
              className="flex-1 border-2 border-dashed border-white/30 rounded-3xl py-5 flex flex-col items-center gap-2 text-white/60 active:border-white/60 active:text-white transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <Upload size={20} />
              </div>
              <span className="text-xs font-semibold">Importar</span>
            </button>
          </div>
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
          onCreateWithDays={(title, days, pendingItems) => {
            onCreateTripWithDays(title, days, pendingItems)
            onClose()
          }}
        />
      )}

      {importing && (
        <ImportTripModal
          onImport={data => { onImportTrip(data); onClose() }}
          onClose={() => setImporting(false)}
        />
      )}

      {editingTrip && (
        <EditTripModal
          trip={editingTrip}
          canDelete={trips.length > 1}
          onClose={() => setEditingTrip(null)}
          onUpdate={(id, title, color) => { onUpdateTrip(id, title, color); setEditingTrip(null) }}
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
    importTrip,
    reorderTrips,
  } = useTrip()

  const today = todayISO()
  const pendingCount = trip.pendingItems.filter(p => p.status === 'pendente').length

  // Pull-to-refresh
  const [weatherKey, setWeatherKey] = useState(0)
  const [pullState, setPullState] = useState<'idle' | 'pulling' | 'refreshing'>('idle')
  const [pullProgress, setPullProgress] = useState(0)
  const pullRef = useRef<{ startY: number; dy: number } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const PULL_THRESHOLD = 70

  function handlePullStart(e: React.TouchEvent) {
    if (pullState === 'refreshing') return
    const el = scrollRef.current
    if (!el || el.scrollTop > 0) return
    pullRef.current = { startY: e.touches[0].clientY, dy: 0 }
  }

  function handlePullMove(e: React.TouchEvent) {
    if (!pullRef.current || pullState === 'refreshing') return
    const dy = e.touches[0].clientY - pullRef.current.startY
    if (dy <= 0) { pullRef.current = null; setPullState('idle'); setPullProgress(0); return }
    pullRef.current.dy = dy
    setPullState('pulling')
    setPullProgress(Math.min(dy / PULL_THRESHOLD, 1.3))
  }

  function handlePullEnd() {
    if (!pullRef.current) return
    const dy = pullRef.current.dy
    pullRef.current = null
    if (pullState === 'refreshing') return
    if (dy >= PULL_THRESHOLD) {
      setPullState('refreshing')
      setPullProgress(0)
      clearWeatherCache()
      setWeatherKey(k => k + 1)
      navigator.serviceWorker?.getRegistrations()
        .then(regs => regs.forEach(r => r.update()))
        .catch(() => {})
      setTimeout(() => setPullState('idle'), 1500)
    } else {
      setPullState('idle')
      setPullProgress(0)
    }
  }

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
          onImportTrip={importTrip}
          onUpdateTrip={updateTripMeta}
          onDeleteTrip={deleteTrip}
          onReorder={reorderTrips}
        />
      )}

      <div className="min-h-screen pb-20" style={{ background: '#1B4F72' }}>
        <div className="max-w-lg mx-auto">
          {/* Decorative stamp banner */}
          <TripBanner />

          <div
            ref={scrollRef}
            className="overflow-y-auto"
            onTouchStart={handlePullStart}
            onTouchMove={handlePullMove}
            onTouchEnd={handlePullEnd}
          >
            {/* Pull-to-refresh indicator */}
            {pullState !== 'idle' && (
              <div
                className="flex items-center justify-center overflow-hidden transition-all duration-150"
                style={{ height: pullState === 'refreshing' ? 44 : Math.min(pullProgress * 44, 44) }}
              >
                <div
                  className={`w-7 h-7 rounded-full border-2 border-white/40 border-t-white ${pullState === 'refreshing' ? 'animate-spin' : ''}`}
                  style={{ opacity: Math.min(pullProgress, 1) }}
                />
              </div>
            )}

            {tab === 'hoje' && (
              <TodayPage
                trip={trip}
                todayDate={today}
                tripGradient={tripGradient(trip)}
                refreshKey={weatherKey}
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
                tripGradient={tripGradient(trip)}
                refreshKey={weatherKey}
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
                days={trip.days}
                onToggle={togglePending}
                onSave={savePendingItem}
                onDelete={deletePendingItem}
                newItem={newPendingItem}
              />
            )}
          </div>
        </div>
      </div>

      <BottomNav
        active={tab}
        onChange={t => {
          if (t === 'viagens') { setShowTripMenu(true); return }
          setTab(t)
        }}
        pendingCount={pendingCount}
        tripColor={tripGradient(trip).match(/#[0-9A-Fa-f]{6}/)?.[0]}
      />
    </ErrorBoundary>
  )
}
