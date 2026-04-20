import { useState } from 'react'
import { X, Trash2 } from 'lucide-react'
import { Activity, ActivityType } from '../types'

const TYPES: { value: ActivityType; label: string; emoji: string }[] = [
  { value: 'attraction', label: 'Atração', emoji: '🏛️' },
  { value: 'food', label: 'Alimentação', emoji: '🍽️' },
  { value: 'flight', label: 'Voo', emoji: '✈️' },
  { value: 'hotel', label: 'Hotel', emoji: '🏨' },
  { value: 'transport', label: 'Transporte', emoji: '🚌' },
  { value: 'shopping', label: 'Compras', emoji: '🛍️' },
  { value: 'other', label: 'Outro', emoji: '📌' },
]

interface Props {
  activity: Activity
  onSave: (a: Activity) => void
  onDelete: () => void
  onClose: () => void
  isNew?: boolean
}

export default function EditActivityModal({ activity, onSave, onDelete, onClose, isNew }: Props) {
  const [form, setForm] = useState<Activity>(activity)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const set = (key: keyof Activity, val: string | boolean) =>
    setForm(p => ({ ...p, [key]: val }))

  const handleSave = () => {
    if (!form.title.trim()) return
    onSave(form)
    onClose()
  }

  const handleDelete = () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    onDelete()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl max-h-[90vh] overflow-y-auto safe-bottom">
        {/* Header */}
        <div className="sticky top-0 bg-white flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {isNew ? 'Nova atividade' : 'Editar atividade'}
          </h2>
          <button onClick={onClose} className="p-1 text-gray-500">
            <X size={20} />
          </button>
        </div>

        <div className="px-4 py-4 space-y-4">
          {/* Type selector */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tipo</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => set('type', t.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    form.type === t.value
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-700 border-gray-200 active:bg-gray-50'
                  }`}
                >
                  <span>{t.emoji}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Título *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="ex: Visitar o Castelo"
              className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Time */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Horário</label>
            <input
              type="time"
              value={form.time}
              onChange={e => set('time', e.target.value)}
              className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Descrição</label>
            <input
              type="text"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Detalhes opcionais"
              className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Location */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Local</label>
            <input
              type="text"
              value={form.location}
              onChange={e => set('location', e.target.value)}
              placeholder="Endereço ou nome do local"
              className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Anotações</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Dicas, confirmações, observações..."
              rows={3}
              className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-4 flex gap-3">
          {!isNew && (
            <button
              onClick={handleDelete}
              className={`flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                confirmDelete
                  ? 'bg-red-600 text-white'
                  : 'bg-red-50 text-red-600 active:bg-red-100'
              }`}
            >
              <Trash2 size={16} />
              {confirmDelete ? 'Confirmar' : 'Excluir'}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!form.title.trim()}
            className="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-50 active:bg-indigo-700"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}
