import { useState } from 'react'
import { X, Droplets, Wind } from 'lucide-react'
import { WeatherData } from '../types'
import { getWeatherEmoji, getWeatherLabel } from '../utils/weather'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Props {
  weather: WeatherData
  city: string
  gradient?: string
}

// ─── Rain Detail Sheet ────────────────────────────────────────────────────────

function rainColor(prob: number): string {
  if (prob >= 70) return '#3B82F6'   // blue-500
  if (prob >= 40) return '#60A5FA'   // blue-400
  if (prob >= 20) return '#93C5FD'   // blue-300
  return '#BFDBFE'                   // blue-200
}

export function RainDetailSheet({
  weather, gradient, onClose,
}: {
  weather: WeatherData
  gradient: string
  onClose: () => void
}) {
  const now = new Date()
  const nowISO = now.toISOString().slice(0, 13) // "2026-04-26T14"

  // Next 24h of hourly data
  const next24 = weather.hourly
    .filter(h => h.time >= nowISO)
    .slice(0, 24)

  // Slots every 3h for compact display
  const slots = next24.filter((_, i) => i % 3 === 0)

  const maxPrecip = Math.max(...next24.map(h => h.precip), 1)

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative rounded-t-3xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Gradient header */}
        <div className="px-5 pt-5 pb-4 flex items-start justify-between flex-shrink-0"
          style={{ background: gradient }}>
          <div>
            <p className="text-white/70 text-xs font-medium uppercase tracking-wide">Chuva detalhada</p>
            <h2 className="text-white text-xl font-bold mt-0.5">{weather.city}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
          >
            <X size={16} className="text-white" />
          </button>
        </div>

        <div className="bg-white overflow-y-auto flex-1 px-5 py-5 space-y-6">
          {/* Hourly bars — next 24h */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Próximas 24 horas
            </p>

            {/* Precipitation bars */}
            <div className="space-y-2">
              {slots.map(h => {
                const hour = h.time.slice(11, 13) + 'h'
                const probW = h.precipProb
                return (
                  <div key={h.time} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-gray-400 w-8 flex-shrink-0">{hour}</span>
                    <div className="flex-1 flex flex-col gap-0.5">
                      {/* Probability bar */}
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${probW}%`, background: rainColor(h.precipProb) }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 w-20 justify-end">
                      <span className="text-xs text-blue-500 font-semibold">{h.precipProb}%</span>
                      {h.precip > 0 && (
                        <span className="text-xs text-gray-400">{h.precip}mm</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Volume chart (only if any rain expected) */}
            {next24.some(h => h.precip > 0) && (
              <div className="mt-4">
                <p className="text-xs text-gray-400 mb-2">Volume (mm)</p>
                <div className="flex items-end gap-1 h-16">
                  {next24.map(h => {
                    const pct = Math.round((h.precip / maxPrecip) * 100)
                    const hour = h.time.slice(11, 13)
                    const showLabel = +hour % 6 === 0
                    return (
                      <div key={h.time} className="flex-1 flex flex-col items-center gap-0.5">
                        <div className="w-full flex items-end justify-center" style={{ height: 48 }}>
                          <div
                            className="w-full rounded-t-sm"
                            style={{
                              height: `${Math.max(pct, h.precip > 0 ? 4 : 0)}%`,
                              background: rainColor(h.precipProb),
                            }}
                          />
                        </div>
                        {showLabel && (
                          <span className="text-[8px] text-gray-400">{hour}h</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 5-day daily outlook */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Próximos dias
            </p>
            <div className="space-y-3">
              {weather.daily.map(day => {
                const label = format(parseISO(day.date + 'T12:00:00'), 'EEE, d MMM', { locale: ptBR })
                const prob = day.precipitationProbability
                return (
                  <div key={day.date} className="flex items-center gap-3">
                    <span className="text-sm">{getWeatherEmoji(day.weatherCode)}</span>
                    <span className="text-xs text-gray-600 capitalize w-24 flex-shrink-0">{label}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${prob}%`, background: rainColor(prob) }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-blue-500 w-8 text-right flex-shrink-0">
                      {prob}%
                    </span>
                    <span className="text-xs text-gray-400 w-16 text-right flex-shrink-0">
                      {day.minTemp}° / {day.maxTemp}°
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <p className="text-center text-xs text-gray-300 pb-2">Open-Meteo · atualizado a cada 30min</p>
        </div>
      </div>
    </div>
  )
}

// ─── WeatherCard ──────────────────────────────────────────────────────────────

export default function WeatherCard({ weather, city, gradient }: Props) {
  const [showDetail, setShowDetail] = useState(false)
  const { current, daily } = weather
  const today = daily[0]

  const bg = gradient ?? 'linear-gradient(135deg,#1B4F72,#0E3252)'
  const topRainProb = today.precipitationProbability

  return (
    <>
      <button
        onClick={() => setShowDetail(true)}
        className="w-full text-left rounded-2xl overflow-hidden shadow-lg active:opacity-90 transition-opacity"
        style={{ background: bg }}
      >
        <div className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/70 text-sm font-medium">{city}</p>
              <div className="flex items-end gap-2 mt-1">
                <span className="text-5xl font-light text-white">{current.temperature}°</span>
                <span className="text-lg mb-2">{getWeatherEmoji(current.weatherCode)}</span>
              </div>
              <p className="text-white/90 text-sm">{getWeatherLabel(current.weatherCode)}</p>
              <p className="text-white/70 text-xs mt-1">{today.minTemp}° / {today.maxTemp}°</p>
            </div>
            <div className="flex flex-col items-end gap-2 text-sm text-white/80">
              <div className="flex items-center gap-1">
                <Droplets size={14} className="text-white/60" />
                <span>{current.humidity}%</span>
              </div>
              <div className="flex items-center gap-1">
                <Wind size={14} className="text-white/60" />
                <span>{current.windspeed} km/h</span>
              </div>
              {topRainProb > 0 && (
                <div className="flex items-center gap-1 bg-white/15 px-2 py-0.5 rounded-full">
                  <span className="text-xs">🌧️</span>
                  <span className="text-xs font-semibold">{topRainProb}%</span>
                </div>
              )}
            </div>
          </div>

          {/* 4-day forecast + tap hint */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-white/20">
            {daily.slice(1, 5).map(day => {
              const d = new Date(day.date + 'T12:00:00')
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1 text-xs">
                  <span className="text-white/60">
                    {d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                  </span>
                  <span>{getWeatherEmoji(day.weatherCode)}</span>
                  <span className="text-white font-medium">{day.maxTemp}°</span>
                  {day.precipitationProbability > 0 && (
                    <span className="text-blue-200 text-[10px]">{day.precipitationProbability}%</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Tap hint */}
        <div className="bg-black/10 px-4 py-1.5 flex items-center justify-center gap-1">
          <span className="text-white/50 text-[11px]">Toque para ver detalhes de chuva</span>
        </div>
      </button>

      {showDetail && (
        <RainDetailSheet
          weather={weather}
          gradient={bg}
          onClose={() => setShowDetail(false)}
        />
      )}
    </>
  )
}
