import { useState } from 'react'
import { ExternalLink, Star } from 'lucide-react'
import { Trip } from '../types'
import { getTipsForCity } from '../data/tips'
import { TipCategory, TipSource } from '../types'

const CATEGORY_META: Record<TipCategory, { label: string; emoji: string }> = {
  food: { label: 'Gastronomia', emoji: '🍽️' },
  transport: { label: 'Transporte', emoji: '🚌' },
  culture: { label: 'Cultura', emoji: '🏛️' },
  safety: { label: 'Segurança', emoji: '🛡️' },
  general: { label: 'Geral', emoji: '✨' },
  budget: { label: 'Economia', emoji: '💰' },
}

const SOURCE_STYLES: Record<TipSource, { dot: string; label: string }> = {
  TripAdvisor: { dot: 'bg-emerald-500', label: 'text-emerald-700' },
  Google: { dot: 'bg-blue-500', label: 'text-blue-700' },
  Booking: { dot: 'bg-blue-800', label: 'text-blue-900' },
  Viajante: { dot: 'bg-purple-500', label: 'text-purple-700' },
}

interface Props {
  trip: Trip
}

export default function TipsPage({ trip }: Props) {
  const cities = Array.from(new Set(trip.days.map(d => d.city)))
  const [city, setCity] = useState(cities[0] ?? '')
  const [filter, setFilter] = useState<TipCategory | 'all'>('all')

  const allTips = getTipsForCity(city)
  const categories = Array.from(new Set(allTips.map(t => t.category)))
  const filtered = filter === 'all' ? allTips : allTips.filter(t => t.category === filter)

  return (
    <div className="px-4 py-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dicas de Viagem</h1>
        <p className="text-sm text-gray-500 mt-1">Recomendações de viajantes reais</p>
      </div>

      {/* City selector */}
      <div className="flex gap-2 overflow-x-auto -mx-1 px-1 scrollbar-hide pb-1">
        {cities.map(c => (
          <button
            key={c}
            onClick={() => { setCity(c); setFilter('all') }}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              city === c
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200 active:bg-gray-50'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto -mx-1 px-1 scrollbar-hide pb-1">
        <button
          onClick={() => setFilter('all')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            filter === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200'
          }`}
        >
          Todas ({allTips.length})
        </button>
        {categories.map(cat => {
          const { emoji, label } = CATEGORY_META[cat]
          const count = allTips.filter(t => t.category === cat).length
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
                filter === cat ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              {emoji} {label} ({count})
            </button>
          )
        })}
      </div>

      {/* Tips list */}
      <div className="space-y-3">
        {filtered.map(tip => {
          const src = SOURCE_STYLES[tip.source]
          return (
            <div key={tip.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-start gap-2 mb-2">
                <span className="text-lg leading-none">{CATEGORY_META[tip.category].emoji}</span>
                <p className="text-sm text-gray-800 leading-relaxed flex-1">"{tip.text}"</p>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${src.dot}`} />
                  <span className={`text-xs font-medium ${src.label}`}>{tip.source}</span>
                  <span className="text-xs text-gray-400">· {tip.author}</span>
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      size={11}
                      className={i < tip.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}
                    />
                  ))}
                </div>
              </div>
              {tip.city && (
                <span className="inline-block mt-2 text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                  {tip.city}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* External links */}
      <div className="bg-gray-50 rounded-2xl p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Ver mais sobre {city}</p>
        <div className="space-y-2">
          {[
            { label: 'TripAdvisor', url: `https://www.tripadvisor.com/Search?q=${encodeURIComponent(city)}`, color: 'text-emerald-700', bg: 'bg-emerald-50' },
            { label: 'Google Travel', url: `https://www.google.com/travel/explore?q=${encodeURIComponent(city)}`, color: 'text-blue-700', bg: 'bg-blue-50' },
            { label: 'Booking.com', url: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city)}`, color: 'text-blue-900', bg: 'bg-blue-50' },
          ].map(link => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-between px-4 py-3 ${link.bg} rounded-xl`}
            >
              <span className={`text-sm font-medium ${link.color}`}>{link.label}</span>
              <ExternalLink size={14} className={link.color} />
            </a>
          ))}
        </div>
      </div>

      <div className="h-4" />
    </div>
  )
}
