import { useState } from 'react'
import { ExternalLink, Star, MapPin, Calendar } from 'lucide-react'
import { Trip } from '../types'
import { getTipsForCity } from '../data/tips'
import { TipCategory, TipSource } from '../types'

const CATEGORY_META: Record<TipCategory, { label: string; emoji: string }> = {
  food:       { label: 'Gastronomia', emoji: '🍽️' },
  restaurant: { label: 'Restaurantes', emoji: '🍴' },
  transport:  { label: 'Transporte',   emoji: '🚌' },
  culture:    { label: 'Cultura',      emoji: '🏛️' },
  safety:     { label: 'Segurança',    emoji: '🛡️' },
  general:    { label: 'Geral',        emoji: '✨' },
  budget:     { label: 'Economia',     emoji: '💰' },
}

const SOURCE_STYLES: Record<TipSource, { dot: string; label: string }> = {
  TripAdvisor: { dot: 'bg-emerald-500', label: 'text-emerald-700' },
  Google:      { dot: 'bg-blue-500',    label: 'text-blue-700'    },
  Booking:     { dot: 'bg-blue-800',    label: 'text-blue-900'    },
  Viajante:    { dot: 'bg-purple-500',  label: 'text-purple-700'  },
}

// Day-by-day program suggestions per city (up to 7 days)
const CITY_PROGRAMS: Record<string, Array<{ label: string; items: string[] }>> = {
  'Amsterdam': [
    { label: 'Chegada', items: ['Trem Schiphol → Centraal (15min, €5)', 'Passeio pelo Jordaan', 'Jantar holandês no canal'] },
    { label: 'Dia 2', items: ['Rijksmuseum (reservar: museumkaart.nl)', 'Vondelpark', 'Van Gogh Museum (reservar!)'] },
    { label: 'Dia 3', items: ['Casa de Anne Frank (reservar MESES antes!)', 'Passeio de barco pelos canais', 'Heineken Experience'] },
    { label: 'Dia 4', items: ['A\'DAM Lookout (ferry gratuito do Centraal)', 'Mercado Albert Cuyp', 'Passeio de bicicleta'] },
    { label: 'Dia 5', items: ['Praia de Zandvoort (trem 30min)', 'Jordaan shopping', 'Última jantar holandesa'] },
  ],
  'Lençóis Maranhenses': [
    { label: 'Dia 1', items: ['Chegada em São Luís ou Barreirinhas', 'Passeio de lancha pelo Rio Preguiças', 'Faróis de Mandacaru e Preguiças'] },
    { label: 'Dia 2', items: ['Lagoas grandes (Bonita, Azul)', 'Dunas em 4x4', 'Pôr do sol nas dunas'] },
    { label: 'Dia 3', items: ['Lagoa Tropical + Gaivota', 'Atins (vilarejo remoto)', 'Kite e windsurf'] },
    { label: 'Dia 4', items: ['Cavalgada ao amanhecer', 'Lagoa Esmeralda', 'Santo Amaro do Maranhão'] },
    { label: 'Dia 5', items: ['Dunas ao amanhecer (luz dourada!)', 'Reserva de Tartarugas', 'Retorno a Barreirinhas'] },
  ],
  'Barreirinhas': [
    { label: 'Dia 1', items: ['Recepção do pacote', 'Tour orientação', 'Jantar no Restaurante Buriti'] },
    { label: 'Dia 2', items: ['Lagoas grandes + dunas em 4x4', 'Mergulho nas lagoas', 'Sunset nas dunas'] },
    { label: 'Dia 3', items: ['Rio Preguiças de lancha', 'Mandacaru + farol', 'Pousada à noite'] },
  ],
  'Atins': [
    { label: 'Dia 1', items: ['Village pequeno e rústico', 'Kite e windsurf na lagoa', 'Jantar simples de pescador'] },
    { label: 'Dia 2', items: ['Caminhada nas dunas ao amanhecer', 'Lagoa dos Pássaros', 'Retorno a Barreirinhas'] },
  ],
  'Santo Amaro': [
    { label: 'Dia único', items: ['Vila histórica colonial', 'Mercado local', 'Igreja de Santo Amaro', 'Lagoas próximas'] },
  ],
  'Bruges': [
    { label: 'Chegada', items: ['Praça Markt + Belfort (€16, 366 degraus)', 'Passeio no centro medieval', 'Jantar: moules-frites'] },
    { label: 'Dia 2', items: ['Passeio de barco nos canais (€12)', 'Choco-Story Museu do Chocolate', 'Cervejaria Bruges Zot (reservar: halvemaan.be)', 'Lago do Amor Minnewater'] },
  ],
  'Brussels': [
    { label: 'Dia único', items: ['Grand Place (mais bela praça da Europa)', 'Manneken Pis + Jeanneke Pis', 'Waffles Maison Dandoy', 'Moules ao estilo Brussels (Chez Leon)'] },
  ],
  'Budapest': [
    { label: 'Dia 1', items: ['Parlamento Húngaro (reservar: parlamento.hu)', 'Bastião dos Pescadores + Castelo', 'Ponte das Correntes ao entardecer'] },
    { label: 'Dia 2', items: ['Banhos Széchenyi (levar roupa de banho!)', 'Grande Mercado Central', 'Ruin Bar Szimpla Kert (chegar antes das 21h)'] },
    { label: 'Dia 3', items: ['Grande Sinagoga + Bairro Judaico', 'Colina Gellért (vista panorâmica)', 'Cruzeiro noturno no Danúbio'] },
    { label: 'Dia 4', items: ['Ilha Margarida', 'Avenida Andrássy (UNESCO)', 'Compras: paprika, Tokaj, kürtőskalács'] },
    { label: 'Dia 5', items: ['Museu de Belas Artes', 'Último almoço húngaro (gulash!)', 'Preparar para próximo destino'] },
  ],
  'Zagreb': [
    { label: 'Dia 1', items: ['Cidade Alta - funicular (€0.66!)', 'Torre Lotrščak (canhonada ao meio-dia)', 'Catedral + Mercado Dolac'] },
    { label: 'Dia 2', items: ['Museu de Relações Partidas (~€7)', 'Praça Ban Jelačić', 'Tkalčićeva street — štrukli e jantar'] },
  ],
  'Plitvice': [
    { label: 'Dia 1', items: ['Chegar cedo (entrar antes das 10h!)', 'Rota H ou K completa (~6h, €35-40)', 'Reservar ONLINE: np-plitvicka-jezera.hr', 'Jantar: cordeiro assado local'] },
    { label: 'Dia 2', items: ['Amanhecer nas cachoeiras (parque abre 07h)', 'Luz dourada é única', 'Seguir para Zadar'] },
  ],
  'Zadar': [
    { label: 'Dia único', items: ['Almoço: crni rižot (risoto negro)', 'Sea Organ (órgão feito pelas ondas)', 'Sun Salutation (círculo luminoso)', 'Cidade Velha + Fórum Romano séc. I', 'Pôr do sol (o mais belo do mundo! — Hitchcock)'] },
  ],
  'Split': [
    { label: 'Dia 1', items: ['Palácio de Diocleciano (UNESCO, séc. IV!)', 'Praia Bačvice + jogo de picigin', 'Promenade Riva ao entardecer'] },
    { label: 'Dia 2 — Hvar', items: ['Ferry Split → Hvar (jadrolinija.hr, ~€8)', 'Fortaleza Španjola (vista incrível)', 'Praia Dubovica (scooter alugada)', 'Ferry de volta antes das 19h'] },
  ],
  'Makarska': [
    { label: 'Passagem', items: ['Riviera de Makarska (praias + Biokovo)', 'Ston: muralhas medievais (€10)', 'Ostras de Ston — as mais famosas da Croácia!', 'Seguir para Dubrovnik'] },
  ],
  'Dubrovnik': [
    { label: 'Dia 1', items: ['Muralhas (€35 — entrar às 08h!)', 'Teleférico ao Monte Srđ (~€30)', 'Jantar: Nautika ou 360° Bar (reservar!)'] },
    { label: 'Dia 2', items: ['Praia Banje (vista das muralhas)', 'Ferry para ilha Lokrum (javalis!)', 'Kayak ao redor das muralhas'] },
    { label: 'Dia 3', items: ['Cavtat de ferry (20min)', 'Últimas compras: sal de Ston, Dingač, travarica', 'Dormir cedo → voo 06:30 amanhã!'] },
  ],
  'São Paulo': [
    { label: 'Embarque', items: ['Chegar GRU 3h antes do voo', 'Terminal 3 — LATAM internacional', 'Check-in online até 24h antes'] },
  ],
  'Hvar': [
    { label: 'Day trip de Split', items: ['Fortaleza Španjola (€10, 20min a pé)', 'Praias: Dubovica ou Pakleni islands', 'Almoço: Giaxa ou Dalmatino'] },
  ],
}

// Google Maps search URL helper
function mapsUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

// Gradient per city group
function cityGradient(city: string): string {
  const c = city.toLowerCase()
  if (c.includes('amsterdam'))      return 'linear-gradient(135deg,#E67E22,#CA6F1E)'
  if (c.includes('bruges') || c.includes('brussels')) return 'linear-gradient(135deg,#2980B9,#1A5276)'
  if (c.includes('budapest'))       return 'linear-gradient(135deg,#8E44AD,#6C3483)'
  if (c.includes('zagreb') || c.includes('plitvice') || c.includes('split') || c.includes('dubrovnik') || c.includes('zadar') || c.includes('hvar') || c.includes('makarska')) return 'linear-gradient(135deg,#27AE60,#1E8449)'
  if (c.includes('lençóis') || c.includes('maranhão') || c.includes('barreirinhas') || c.includes('atins')) return 'linear-gradient(135deg,#1BB8A9,#0D9488)'
  return 'linear-gradient(135deg,#7F8C8D,#566573)'
}

interface Props { trip: Trip }

export default function TipsPage({ trip }: Props) {
  const cities = Array.from(new Set(trip.days.map(d => d.city)))
  const [city, setCity] = useState(cities[0] ?? '')
  const [tab, setTab] = useState<'program' | 'tips'>('program')
  const [filter, setFilter] = useState<TipCategory | 'all'>('all')

  const daysInCity = trip.days.filter(d => d.city === city).length
  const program = CITY_PROGRAMS[city] ?? []
  const displayProgram = program.slice(0, Math.max(daysInCity, 1))

  const allTips = getTipsForCity(city)
  const categories = Array.from(new Set(allTips.map(t => t.category)))
  const filtered = filter === 'all' ? allTips : allTips.filter(t => t.category === filter)

  return (
    <div className="px-4 py-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dicas de Viagem</h1>
        <p className="text-sm text-gray-500 mt-1">Roteiro sugerido e recomendações por cidade</p>
      </div>

      {/* City pills */}
      <div className="flex gap-2 overflow-x-auto -mx-1 px-1 scrollbar-hide pb-1">
        {cities.map(c => {
          const days = trip.days.filter(d => d.city === c).length
          return (
            <button
              key={c}
              onClick={() => { setCity(c); setFilter('all') }}
              className={`flex-shrink-0 px-3 py-2 rounded-2xl text-xs font-semibold transition-colors ${
                city === c ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border border-gray-200'
              }`}
            >
              {c}
              <span className={`ml-1.5 text-[10px] ${city === c ? 'text-white/70' : 'text-gray-400'}`}>
                {days}d
              </span>
            </button>
          )
        })}
      </div>

      {/* Tab switcher */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
        <button
          onClick={() => setTab('program')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${tab === 'program' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
        >
          <Calendar size={12} /> Roteiro sugerido
        </button>
        <button
          onClick={() => setTab('tips')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${tab === 'tips' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
        >
          <Star size={12} /> Dicas ({allTips.length})
        </button>
      </div>

      {/* ── PROGRAM TAB ────────────────────────────────── */}
      {tab === 'program' && (
        <div className="space-y-3">
          {/* City header card */}
          <div className="rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 flex items-center justify-between" style={{ background: cityGradient(city) }}>
              <div>
                <p className="text-white font-bold text-lg">{city}</p>
                <p className="text-white/70 text-xs mt-0.5">
                  {daysInCity} dia{daysInCity !== 1 ? 's' : ''} de estadia
                </p>
              </div>
              <a
                href={mapsUrl(city + ' pontos turísticos')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-white/20 text-white text-xs font-semibold px-3 py-2 rounded-xl active:opacity-70"
              >
                <MapPin size={12} /> Maps
              </a>
            </div>

            {/* Day-by-day program */}
            {displayProgram.length > 0 ? (
              <div className="bg-white divide-y divide-gray-50">
                {displayProgram.map((block, i) => (
                  <div key={i} className="px-4 py-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{block.label}</p>
                    <ul className="space-y-1.5">
                      {block.items.map((item, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-indigo-400 mt-0.5 flex-shrink-0">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white px-4 py-4 text-sm text-gray-400">
                Explore {city} — use Maps para descobrir os pontos turísticos.
              </div>
            )}
          </div>

          {/* Quick Maps links for key spots */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Abrir no Google Maps</p>
            {[
              { label: `Aeroporto de ${city}`, query: `aeroporto airport ${city}` },
              { label: `Rodoviária de ${city}`, query: `bus station rodoviária ${city}` },
              { label: `Centro histórico de ${city}`, query: `centro histórico old town ${city}` },
              { label: `Hotéis em ${city}`, query: `hotéis ${city}` },
            ].map(link => (
              <a
                key={link.label}
                href={mapsUrl(link.query)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-xl active:bg-gray-100"
              >
                <span className="text-sm text-gray-700 font-medium">{link.label}</span>
                <MapPin size={14} className="text-sky-500 flex-shrink-0" />
              </a>
            ))}
          </div>

          {/* External links */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Pesquise mais</p>
            {[
              { label: 'TripAdvisor', url: `https://www.tripadvisor.com/Search?q=${encodeURIComponent(city)}`, color: 'text-emerald-700', bg: 'bg-emerald-50' },
              { label: 'Google Travel', url: `https://www.google.com/travel/explore?q=${encodeURIComponent(city)}`, color: 'text-blue-700', bg: 'bg-blue-50' },
              { label: 'Booking.com', url: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city)}`, color: 'text-blue-900', bg: 'bg-indigo-50' },
            ].map(link => (
              <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
                className={`flex items-center justify-between px-4 py-3 ${link.bg} rounded-xl`}
              >
                <span className={`text-sm font-medium ${link.color}`}>{link.label}</span>
                <ExternalLink size={14} className={link.color} />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ── TIPS TAB ───────────────────────────────────── */}
      {tab === 'tips' && (
        <div className="space-y-4">
          {/* Category filter */}
          <div className="flex gap-2 overflow-x-auto -mx-1 px-1 scrollbar-hide pb-1">
            <button onClick={() => setFilter('all')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${filter === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200'}`}
            >
              Todas ({allTips.length})
            </button>
            {categories.map(cat => {
              const { emoji, label } = CATEGORY_META[cat]
              const count = allTips.filter(t => t.category === cat).length
              return (
                <button key={cat} onClick={() => setFilter(cat)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${filter === cat ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200'}`}
                >
                  {emoji} {label} ({count})
                </button>
              )
            })}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              Nenhuma dica ainda para {city}
            </div>
          ) : (
            filtered.map(tip => {
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
                        <Star key={i} size={11}
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
            })
          )}
        </div>
      )}

      <div className="h-4" />
    </div>
  )
}
