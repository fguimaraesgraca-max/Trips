import { useState } from 'react'
import { Plus, CheckCircle2, Circle, ChevronDown, ChevronUp, Trash2, Pencil, X, Plane, Hotel, Car, Download } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PendingItem, PendingPriority, Day, ActivityType } from '../types'
import { parsePendingBlock } from '../utils/parseItinerary'

const PRIORITY_META: Record<PendingPriority, { label: string; dot: string; bg: string; text: string }> = {
  critico:    { label: 'Crítico',    dot: 'bg-red-500',     bg: 'bg-red-50 border-red-200',     text: 'text-red-700'     },
  importante: { label: 'Importante', dot: 'bg-amber-400',   bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700'   },
  normal:     { label: 'Normal',     dot: 'bg-emerald-400', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
}

// ─── Booking extraction (for "Reservas no roteiro" section) ───────────────────

interface BookingInfo {
  actType: 'flight' | 'hotel' | 'transport'
  title: string
  date: string
  city: string
  airline?: string
  reservationCode?: string
  checkinTime?: string
  checkoutTime?: string
}

function extractReservationCode(text: string): string | null {
  const named = text.match(/(?:reserva|código|code|ref|booking|record|no\.?)\s*[:#]?\s*([A-Z0-9]{5,12})/i)
  if (named) return named[1]
  const numeric = text.match(/\b(\d{7,12})\b/)
  if (numeric) return numeric[1]
  return null
}

function extractAirline(text: string): string | null {
  const t = text.toLowerCase()
  if (/\blatam\b/.test(t)) return 'LATAM'
  if (/\btap\b/.test(t)) return 'TAP'
  if (/\bklm\b/.test(t)) return 'KLM'
  if (/\bryanair\b/.test(t)) return 'Ryanair'
  if (/\beasyjet\b/.test(t)) return 'EasyJet'
  if (/\bwizz\b/.test(t)) return 'Wizz Air'
  if (/\bazul\b/.test(t)) return 'Azul'
  if (/\bgol\b/.test(t)) return 'GOL'
  if (/\blufthansa\b/.test(t)) return 'Lufthansa'
  if (/\bair france\b/.test(t)) return 'Air France'
  if (/\bturkish\b/.test(t)) return 'Turkish Airlines'
  if (/\biberia\b/.test(t)) return 'Iberia'
  if (/\bflibco\b/.test(t)) return 'Flibco'
  return null
}

function extractCheckinTime(text: string): string | null {
  const m = text.match(/check.?in[:\s]+(?:a partir d[ao]s?\s+)?(\d{1,2}[h:]\d{0,2})/i)
  if (m) return m[1].replace(/h(\d*)$/, (_, min) => `:${(min || '00').padStart(2, '0')}`)
  return null
}

function extractCheckoutTime(text: string): string | null {
  const m = text.match(/check.?out[:\s]+(?:at[eé]\s+)?(\d{1,2}[h:]\d{0,2})/i)
  if (m) return m[1].replace(/h(\d*)$/, (_, min) => `:${(min || '00').padStart(2, '0')}`)
  return null
}

const BOOKABLE_TYPES: ActivityType[] = ['flight', 'hotel', 'transport']

function extractBookings(days: Day[]): BookingInfo[] {
  const result: BookingInfo[] = []
  for (const day of days) {
    for (const act of day.activities) {
      if (!BOOKABLE_TYPES.includes(act.type)) continue
      const text = [act.title, act.description, act.notes].join(' ')
      const reservationCode = extractReservationCode(text) ?? undefined
      const airline = (act.type === 'flight' || act.type === 'transport') ? extractAirline(text) ?? undefined : undefined
      const checkinTime = extractCheckinTime(text) ?? undefined
      const checkoutTime = extractCheckoutTime(text) ?? undefined
      if (reservationCode || airline || checkinTime || checkoutTime) {
        result.push({
          actType: act.type as 'flight' | 'hotel' | 'transport',
          title: act.title,
          date: day.date,
          city: day.city,
          reservationCode,
          airline,
          checkinTime,
          checkoutTime,
        })
      }
    }
  }
  return result
}

// ─── ImportModal ──────────────────────────────────────────────────────────────

function ImportModal({ onImport, onClose }: { onImport: (items: PendingItem[]) => void; onClose: () => void }) {
  const [text, setText] = useState('')

  const preview = parsePendingBlock(text)

  function handleImport() {
    if (preview.length === 0) return
    onImport(preview)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold">Importar pendências</h2>
            <p className="text-xs text-gray-400 mt-0.5">Cole sua lista de itens numerados ou com bullet</p>
          </div>
          <button onClick={onClose}><X size={20} className="text-gray-500" /></button>
        </div>
        <div className="px-4 py-4 space-y-3">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={'1. Comprar passagem ônibus Budapest → Zagreb (28/Mai)\n2. Reservar hotel em Bruxelas para 22/Mai\n3. Alugar carro em Zagreb\n- Seguro viagem'}
            rows={8}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F72] resize-none font-mono"
          />
          {preview.length > 0 && (
            <div className="bg-[#EAF2F8] border border-[#C5DDE9] rounded-xl px-3 py-2.5 space-y-1.5">
              <p className="text-xs font-semibold text-[#163F5C]">{preview.length} item{preview.length !== 1 ? 's' : ''} detectado{preview.length !== 1 ? 's' : ''}:</p>
              {preview.map((item, i) => {
                const m = PRIORITY_META[item.priority]
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${m.dot}`} />
                    <span className="text-xs text-gray-700 truncate">{item.title}</span>
                    {item.dateNeeded && <span className="text-xs text-gray-400 flex-shrink-0">{item.dateNeeded}</span>}
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-4">
          <button
            onClick={handleImport}
            disabled={preview.length === 0}
            className="w-full bg-[#1B4F72] text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-40"
          >
            Adicionar {preview.length > 0 ? `${preview.length} pendência${preview.length !== 1 ? 's' : ''}` : 'pendências'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── BookingReminderCard ──────────────────────────────────────────────────────

function BookingReminderCard({
  info, added, onAddToPending,
}: {
  info: BookingInfo
  added: boolean
  onAddToPending: (item: PendingItem) => void
}) {
  const isHotel = info.actType === 'hotel'
  const isTransport = info.actType === 'transport'
  const Icon = isHotel ? Hotel : isTransport ? Car : Plane
  const bg = isHotel ? 'bg-purple-50 border-purple-100' : isTransport ? 'bg-gray-50 border-gray-200' : 'bg-sky-50 border-sky-100'
  const iconBg = isHotel ? 'bg-purple-100' : isTransport ? 'bg-gray-100' : 'bg-sky-100'
  const iconColor = isHotel ? 'text-purple-600' : isTransport ? 'text-gray-600' : 'text-sky-600'
  const codeBg = isHotel ? 'bg-purple-100 text-purple-800' : isTransport ? 'bg-gray-200 text-gray-800' : 'bg-sky-100 text-sky-800'

  const dateLabel = (() => {
    try { return format(parseISO(info.date), "d 'de' MMM", { locale: ptBR }) }
    catch { return info.date }
  })()

  function handleAdd() {
    if (added) return
    const notes = [
      info.reservationCode ? `Reserva #${info.reservationCode}` : '',
      info.airline ? `Cia: ${info.airline}` : '',
      info.checkinTime ? `Check-in: ${info.checkinTime}` : '',
      info.checkoutTime ? `Check-out: ${info.checkoutTime}` : '',
    ].filter(Boolean).join(' · ')
    onAddToPending({
      id: Math.random().toString(36).slice(2, 9),
      title: info.title,
      dateNeeded: `${dateLabel} · ${info.city}`,
      howTo: '',
      responsible: '',
      status: 'pendente',
      priority: info.actType === 'flight' ? 'critico' : 'importante',
      notes,
    })
  }

  return (
    <div className={`rounded-2xl border px-4 py-3 ${bg}`}>
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${iconBg}`}>
          <Icon size={16} className={iconColor} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-snug">{info.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">📅 {dateLabel} · {info.city}</p>
          {info.airline && <p className="text-xs text-gray-500">✈️ {info.airline}</p>}
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {info.reservationCode && (
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg ${codeBg}`}>#{info.reservationCode}</span>
            )}
            {info.checkinTime && (
              <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-lg font-medium">Check-in: {info.checkinTime}</span>
            )}
            {info.checkoutTime && (
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-lg font-medium">Check-out: {info.checkoutTime}</span>
            )}
          </div>
        </div>
        <button
          onClick={handleAdd}
          disabled={added}
          className={`flex-shrink-0 mt-0.5 w-7 h-7 rounded-full border flex items-center justify-center transition-colors ${
            added
              ? 'bg-emerald-50 border-emerald-200 cursor-default'
              : 'bg-white border-gray-200 active:bg-[#EAF2F8]'
          }`}
          title={added ? 'Já adicionado' : 'Adicionar à lista de pendências'}
        >
          {added
            ? <CheckCircle2 size={14} className="text-emerald-500" />
            : <Plus size={14} className="text-[#1B4F72]" />}
        </button>
      </div>
    </div>
  )
}

// ─── EditPendingModal ─────────────────────────────────────────────────────────

function EditPendingModal({
  item, onSave, onDelete, onClose, isNew,
}: {
  item: PendingItem; onSave: (i: PendingItem) => void; onDelete: () => void; onClose: () => void; isNew?: boolean
}) {
  const [form, setForm] = useState<PendingItem>(item)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const set = (k: keyof PendingItem, v: string) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold">{isNew ? 'Nova pendência' : 'Editar pendência'}</h2>
          <button onClick={onClose}><X size={20} className="text-gray-500" /></button>
        </div>
        <div className="px-4 py-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Prioridade</label>
            <div className="flex gap-2 mt-2">
              {(['critico', 'importante', 'normal'] as PendingPriority[]).map(p => {
                const m = PRIORITY_META[p]
                return (
                  <button key={p} onClick={() => set('priority', p)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${form.priority === p ? `${m.bg} ${m.text} border-current` : 'bg-white text-gray-600 border-gray-200'}`}>
                    <span className={`w-2 h-2 rounded-full ${m.dot}`} />{m.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Título *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="ex: Comprar passagem ônibus Budapest → Zagreb"
              className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F72]" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Quando</label>
            <input value={form.dateNeeded} onChange={e => set('dateNeeded', e.target.value)}
              placeholder="ex: 28/Mai"
              className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F72]" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Responsável</label>
            <input value={form.responsible} onChange={e => set('responsible', e.target.value)}
              placeholder="ex: Patrícia"
              className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F72]" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Como resolver</label>
            <textarea value={form.howTo} onChange={e => set('howTo', e.target.value)}
              placeholder="ex: Booking.com ou ligar para o hotel" rows={2}
              className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F72] resize-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Notas</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
              className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F72] resize-none" />
          </div>
        </div>
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-4 flex gap-3">
          {!isNew && (
            <button onClick={() => { if (!confirmDelete) { setConfirmDelete(true) } else { onDelete(); onClose() } }}
              className={`flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-medium ${confirmDelete ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600'}`}>
              <Trash2 size={16} />{confirmDelete ? 'Confirmar' : 'Excluir'}
            </button>
          )}
          <button onClick={() => { if (form.title.trim()) { onSave(form); onClose() } }}
            disabled={!form.title.trim()}
            className="flex-1 bg-[#1B4F72] text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-50">
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── PendingCard ──────────────────────────────────────────────────────────────

function PendingCard({ item, onToggle, onEdit }: { item: PendingItem; onToggle: () => void; onEdit: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const m = PRIORITY_META[item.priority]
  const done = item.status === 'feito'

  return (
    <div className={`rounded-2xl border overflow-hidden ${done ? 'border-gray-100 opacity-60' : m.bg}`}>
      <button onClick={() => setExpanded(e => !e)} className="w-full flex items-start gap-3 px-4 py-3.5 text-left">
        <button onClick={e => { e.stopPropagation(); onToggle() }} className="mt-0.5 flex-shrink-0">
          {done
            ? <CheckCircle2 size={22} className="text-emerald-500" />
            : <Circle size={22} className="text-gray-300" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm font-semibold leading-snug ${done ? 'line-through text-gray-400' : 'text-gray-900'}`}>{item.title}</p>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className={`w-2 h-2 rounded-full ${m.dot}`} />
              <span className={`text-xs font-medium ${m.text}`}>{m.label}</span>
            </div>
          </div>
          {item.dateNeeded && <p className="text-xs text-gray-500 mt-0.5">📅 {item.dateNeeded}</p>}
          {item.responsible && <p className="text-xs text-gray-500">👤 {item.responsible}</p>}
        </div>
        <div className="flex-shrink-0 mt-0.5">
          {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-black/5 pt-3 space-y-2">
          {item.howTo && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Como resolver</p>
              <p className="text-sm text-gray-800 mt-0.5">{item.howTo}</p>
            </div>
          )}
          {item.notes && (
            <div className="bg-white/60 rounded-xl px-3 py-2">
              <p className="text-xs text-gray-600">{item.notes}</p>
            </div>
          )}
          <button onClick={onEdit} className="flex items-center gap-1.5 text-xs text-[#1B4F72] font-medium mt-1">
            <Pencil size={12} /> Editar
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

interface Props {
  items: PendingItem[]
  days?: Day[]
  onToggle: (id: string) => void
  onSave: (item: PendingItem) => void
  onDelete: (id: string) => void
  newItem: () => PendingItem
}

export default function PendenciasPage({ items, days = [], onToggle, onSave, onDelete, newItem }: Props) {
  const [editing, setEditing] = useState<{ item: PendingItem; isNew: boolean } | null>(null)
  const [importing, setImporting] = useState(false)

  const pending = items.filter(i => i.status === 'pendente')
  const done = items.filter(i => i.status === 'feito')
  const priorityOrder: Record<PendingPriority, number> = { critico: 0, importante: 1, normal: 2 }
  const sorted = [...pending].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  // Normalised set of existing titles for deduplication
  const existingTitles = new Set(items.map(i => i.title.trim().toLowerCase()))

  // Only show bookings not yet in the pending list
  const allBookings = extractBookings(days)
  const unadded = allBookings.filter(b => !existingTitles.has(b.title.trim().toLowerCase()))

  function handleImport(newItems: PendingItem[]) {
    newItems
      .filter(item => !existingTitles.has(item.title.trim().toLowerCase()))
      .forEach(item => onSave(item))
  }

  function handleAddBookingToPending(item: PendingItem) {
    if (!existingTitles.has(item.title.trim().toLowerCase())) {
      onSave(item)
    }
  }

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pendências</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {pending.length} pendente{pending.length !== 1 ? 's' : ''}
            {done.length > 0 && ` · ${done.length} resolvida${done.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setImporting(true)}
            className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-xl text-sm font-medium shadow-sm"
          >
            <Download size={15} /> Importar
          </button>
          <button
            onClick={() => setEditing({ item: newItem(), isNew: true })}
            className="flex items-center gap-1.5 bg-[#1B4F72] text-white px-3 py-2 rounded-xl text-sm font-medium"
          >
            <Plus size={15} /> Nova
          </button>
        </div>
      </div>

      {/* Progress */}
      {items.length > 0 && (
        <div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${(done.length / items.length) * 100}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-1 text-right">{done.length}/{items.length} resolvidas</p>
        </div>
      )}

      {/* Pending items */}
      {sorted.length > 0 && (
        <div className="space-y-3">
          {sorted.map(item => (
            <PendingCard key={item.id} item={item}
              onToggle={() => onToggle(item.id)}
              onEdit={() => setEditing({ item, isNew: false })} />
          ))}
        </div>
      )}

      {/* Done items */}
      {done.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Resolvidas ✓</p>
          {done.map(item => (
            <PendingCard key={item.id} item={item}
              onToggle={() => onToggle(item.id)}
              onEdit={() => setEditing({ item, isNew: false })} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <CheckCircle2 size={44} className="text-gray-200 mb-4" />
          <p className="text-sm font-medium">Sem pendências!</p>
          <p className="text-xs text-gray-400 mt-1 text-center max-w-xs">
            Crie itens manualmente ou use <strong>Importar</strong> para colar sua lista do roteiro
          </p>
        </div>
      )}

      {/* Booking reminders — only unadded items */}
      {unadded.length > 0 && (
        <div className="pt-2 space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Detectado no roteiro 🎫 <span className="normal-case font-normal">({unadded.length} para adicionar)</span>
          </p>
          {unadded.map((b, i) => (
            <BookingReminderCard key={i} info={b}
              added={false}
              onAddToPending={handleAddBookingToPending} />
          ))}
        </div>
      )}

      <div className="h-4" />

      {editing && (
        <EditPendingModal item={editing.item} isNew={editing.isNew}
          onSave={onSave}
          onDelete={() => onDelete(editing.item.id)}
          onClose={() => setEditing(null)} />
      )}

      {importing && (
        <ImportModal onImport={handleImport} onClose={() => setImporting(false)} />
      )}
    </div>
  )
}
