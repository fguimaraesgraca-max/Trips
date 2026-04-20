import { useState } from 'react'
import { Plus, CheckCircle2, Circle, ChevronDown, ChevronUp, Trash2, Pencil, X } from 'lucide-react'
import { PendingItem, PendingPriority } from '../types'

const PRIORITY_META: Record<PendingPriority, { label: string; dot: string; bg: string; text: string }> = {
  critico: { label: 'Crítico', dot: 'bg-red-500', bg: 'bg-red-50 border-red-200', text: 'text-red-700' },
  importante: { label: 'Importante', dot: 'bg-amber-400', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
  normal: { label: 'Normal', dot: 'bg-emerald-400', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
}

function EditPendingModal({
  item,
  onSave,
  onDelete,
  onClose,
  isNew,
}: {
  item: PendingItem
  onSave: (i: PendingItem) => void
  onDelete: () => void
  onClose: () => void
  isNew?: boolean
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
          {/* Priority */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Prioridade</label>
            <div className="flex gap-2 mt-2">
              {(['critico', 'importante', 'normal'] as PendingPriority[]).map(p => {
                const m = PRIORITY_META[p]
                return (
                  <button
                    key={p}
                    onClick={() => set('priority', p)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      form.priority === p ? `${m.bg} ${m.text} border-current` : 'bg-white text-gray-600 border-gray-200'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${m.dot}`} />
                    {m.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Título *</label>
            <input
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="ex: Transfer SLZ → Santo Amaro"
              className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Quando</label>
            <input
              value={form.dateNeeded}
              onChange={e => set('dateNeeded', e.target.value)}
              placeholder="ex: Qua 29/04 — MADRUGADA"
              className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Responsável</label>
            <input
              value={form.responsible}
              onChange={e => set('responsible', e.target.value)}
              placeholder="ex: Patrícia"
              className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Como resolver</label>
            <textarea
              value={form.howTo}
              onChange={e => set('howTo', e.target.value)}
              placeholder="ex: Booking Transfer ou ligar para o hotel"
              rows={2}
              className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Notas</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={2}
              className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
        </div>
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-4 flex gap-3">
          {!isNew && (
            <button
              onClick={() => { if (!confirmDelete) { setConfirmDelete(true) } else { onDelete(); onClose() } }}
              className={`flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-medium ${confirmDelete ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600'}`}
            >
              <Trash2 size={16} />
              {confirmDelete ? 'Confirmar' : 'Excluir'}
            </button>
          )}
          <button
            onClick={() => { if (form.title.trim()) { onSave(form); onClose() } }}
            disabled={!form.title.trim()}
            className="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-50"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

function PendingCard({
  item,
  onToggle,
  onEdit,
}: {
  item: PendingItem
  onToggle: () => void
  onEdit: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const m = PRIORITY_META[item.priority]
  const done = item.status === 'feito'

  return (
    <div className={`rounded-2xl border overflow-hidden ${done ? 'border-gray-100 opacity-60' : m.bg}`}>
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-start gap-3 px-4 py-3.5 text-left"
      >
        {/* Toggle done */}
        <button
          onClick={e => { e.stopPropagation(); onToggle() }}
          className="mt-0.5 flex-shrink-0"
        >
          {done
            ? <CheckCircle2 size={22} className="text-emerald-500" />
            : <Circle size={22} className="text-gray-300" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm font-semibold leading-snug ${done ? 'line-through text-gray-400' : 'text-gray-900'}`}>
              {item.title}
            </p>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className={`w-2 h-2 rounded-full ${m.dot}`} />
              <span className={`text-xs font-medium ${m.text}`}>{m.label}</span>
            </div>
          </div>
          {item.dateNeeded && (
            <p className="text-xs text-gray-500 mt-0.5">📅 {item.dateNeeded}</p>
          )}
          {item.responsible && (
            <p className="text-xs text-gray-500">👤 {item.responsible}</p>
          )}
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
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium mt-1"
          >
            <Pencil size={12} /> Editar
          </button>
        </div>
      )}
    </div>
  )
}

interface Props {
  items: PendingItem[]
  onToggle: (id: string) => void
  onSave: (item: PendingItem) => void
  onDelete: (id: string) => void
  newItem: () => PendingItem
}

export default function PendenciasPage({ items, onToggle, onSave, onDelete, newItem }: Props) {
  const [editing, setEditing] = useState<{ item: PendingItem; isNew: boolean } | null>(null)

  const pending = items.filter(i => i.status === 'pendente')
  const done = items.filter(i => i.status === 'feito')

  const priorityOrder: Record<PendingPriority, number> = { critico: 0, importante: 1, normal: 2 }
  const sorted = [...pending].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pendências</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {pending.length} pendente{pending.length !== 1 ? 's' : ''}
            {done.length > 0 && ` · ${done.length} resolvida${done.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={() => setEditing({ item: newItem(), isNew: true })}
          className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium"
        >
          <Plus size={16} /> Nova
        </button>
      </div>

      {/* Progress */}
      {items.length > 0 && (
        <div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${items.length > 0 ? (done.length / items.length) * 100 : 0}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1 text-right">
            {done.length}/{items.length} resolvidas
          </p>
        </div>
      )}

      {sorted.length > 0 && (
        <div className="space-y-3">
          {sorted.map(item => (
            <PendingCard
              key={item.id}
              item={item}
              onToggle={() => onToggle(item.id)}
              onEdit={() => setEditing({ item, isNew: false })}
            />
          ))}
        </div>
      )}

      {done.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Resolvidas ✓</p>
          {done.map(item => (
            <PendingCard
              key={item.id}
              item={item}
              onToggle={() => onToggle(item.id)}
              onEdit={() => setEditing({ item, isNew: false })}
            />
          ))}
        </div>
      )}

      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <CheckCircle2 size={48} className="text-gray-200 mb-4" />
          <p className="text-sm font-medium">Sem pendências!</p>
          <button
            onClick={() => setEditing({ item: newItem(), isNew: true })}
            className="mt-4 text-sm text-indigo-600 font-medium"
          >
            Adicionar pendência
          </button>
        </div>
      )}

      <div className="h-4" />

      {editing && (
        <EditPendingModal
          item={editing.item}
          isNew={editing.isNew}
          onSave={onSave}
          onDelete={() => onDelete(editing.item.id)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
