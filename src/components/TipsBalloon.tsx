import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Star, ExternalLink } from 'lucide-react'
import { Tip, TipCategory } from '../types'
import { getTipsForCity } from '../data/tips'

const CATEGORY_LABELS: Record<TipCategory, string> = {
  food: '🍽️ Gastronomia',
  restaurant: '🍴 Restaurantes',
  transport: '🚌 Transporte',
  culture: '🏛️ Cultura',
  safety: '🛡️ Segurança',
  general: '✨ Geral',
  budget: '💰 Economia',
}

const SOURCE_COLORS: Record<string, string> = {
  TripAdvisor: 'text-emerald-600',
  Google: 'text-blue-600',
  Booking: 'text-blue-800',
  Viajante: 'text-purple-600',
}

interface Props {
  city: string
}

export default function TipsBalloon({ city }: Props) {
  const all = getTipsForCity(city)
  const [filter, setFilter] = useState<TipCategory | 'all'>('all')
  const [idx, setIdx] = useState(0)

  const filtered = filter === 'all' ? all : all.filter(t => t.category === filter)

  useEffect(() => { setIdx(0) }, [city, filter])

  // Auto-advance every 8s
  useEffect(() => {
    if (filtered.length <= 1) return
    const t = setTimeout(() => setIdx(i => (i + 1) % filtered.length), 8000)
    return () => clearTimeout(t)
  }, [idx, filtered.length])

  const tip: Tip | undefined = filtered[idx]

  if (!tip) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-5 text-center space-y-2">
        <p className="text-2xl">💬</p>
        <p className="text-sm font-semibold text-gray-700">Dicas para {city}</p>
        <p className="text-xs text-gray-400">Pesquise experiências de outros viajantes</p>
        <div className="flex justify-center gap-4 pt-1">
          <a href={`https://www.tripadvisor.com/Search?q=${encodeURIComponent(city)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-emerald-600 font-medium"><ExternalLink size={12} /> TripAdvisor</a>
          <a href={`https://www.google.com/search?q=${encodeURIComponent('o que fazer em ' + city)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-600 font-medium"><ExternalLink size={12} /> Google</a>
        </div>
      </div>
    )
  }

  const categories = Array.from(new Set(all.map(t => t.category)))

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">💬 Dicas de Viajantes</h3>
          <span className="text-xs text-gray-400">{idx + 1}/{filtered.length}</span>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          <button
            onClick={() => setFilter('all')}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              filter === 'all'
                ? 'bg-[#1B4F72] text-white'
                : 'bg-gray-100 text-gray-600 active:bg-gray-200'
            }`}
          >
            Todas
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap ${
                filter === cat
                  ? 'bg-[#1B4F72] text-white'
                  : 'bg-gray-100 text-gray-600 active:bg-gray-200'
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Tip card */}
      <div className="px-4 pb-3">
        <div className="bg-gray-50 rounded-xl p-3 relative">
          <p className="text-sm text-gray-800 leading-relaxed">"{tip.text}"</p>
          <div className="flex items-center justify-between mt-3">
            <div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    size={10}
                    className={i < tip.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {tip.author} via{' '}
                <span className={`font-medium ${SOURCE_COLORS[tip.source]}`}>{tip.source}</span>
              </p>
            </div>
            {tip.city && (
              <span className="text-xs bg-[#EAF2F8] text-[#1B4F72] px-2 py-0.5 rounded-full">
                {tip.city}
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-3">
          <button
            onClick={() => setIdx(i => (i - 1 + filtered.length) % filtered.length)}
            disabled={filtered.length <= 1}
            className="p-2 text-gray-400 disabled:opacity-30 active:text-[#1B4F72]"
          >
            <ChevronLeft size={18} />
          </button>

          {/* Dots */}
          <div className="flex gap-1.5">
            {filtered.slice(0, 8).map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === idx ? 'bg-[#1B4F72] w-4' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => setIdx(i => (i + 1) % filtered.length)}
            disabled={filtered.length <= 1}
            className="p-2 text-gray-400 disabled:opacity-30 active:text-[#1B4F72]"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* View more */}
      <div className="border-t border-gray-100 px-4 py-2.5 flex gap-3">
        <a
          href={`https://www.tripadvisor.com/Search?q=${encodeURIComponent(city)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-emerald-600 font-medium"
        >
          <ExternalLink size={12} /> TripAdvisor
        </a>
        <a
          href={`https://www.google.com/search?q=${encodeURIComponent('o que fazer em ' + city)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-blue-600 font-medium"
        >
          <ExternalLink size={12} /> Google
        </a>
      </div>
    </div>
  )
}
