import { Droplets, Wind } from 'lucide-react'
import { WeatherData } from '../types'
import { getWeatherEmoji, getWeatherLabel } from '../utils/weather'

interface Props {
  weather: WeatherData
  city: string
  gradient?: string
}

export default function WeatherCard({ weather, city, gradient }: Props) {
  const { current, daily } = weather
  const today = daily[0]

  const bg = gradient
    ? { background: gradient }
    : undefined
  const cls = gradient
    ? 'rounded-2xl p-4 text-white shadow-lg'
    : 'bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl p-4 text-white shadow-lg'

  return (
    <div className={cls} style={bg}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-white/70 text-sm font-medium">{city}</p>
          <div className="flex items-end gap-2 mt-1">
            <span className="text-5xl font-light">{current.temperature}°</span>
            <span className="text-lg mb-2">{getWeatherEmoji(current.weatherCode)}</span>
          </div>
          <p className="text-white/90 text-sm">{getWeatherLabel(current.weatherCode)}</p>
          <p className="text-white/70 text-xs mt-1">
            {today.minTemp}° / {today.maxTemp}°
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm text-white/80">
          <div className="flex items-center gap-1">
            <Droplets size={14} className="text-white/60" />
            <span>{current.humidity}%</span>
          </div>
          <div className="flex items-center gap-1">
            <Wind size={14} className="text-white/60" />
            <span>{current.windspeed} km/h</span>
          </div>
          {today.precipitationProbability > 0 && (
            <div className="flex items-center gap-1">
              <span>🌂</span>
              <span>{today.precipitationProbability}%</span>
            </div>
          )}
        </div>
      </div>

      {/* 4-day forecast */}
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
            </div>
          )
        })}
      </div>
    </div>
  )
}
