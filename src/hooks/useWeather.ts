import { useState, useEffect } from 'react'
import { WeatherData } from '../types'

const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast'

const cache: Record<string, { data: WeatherData; ts: number }> = {}
const TTL = 30 * 60 * 1000

async function fetchWeatherWithDays(city: string, forecastDays: number): Promise<WeatherData> {
  const key = `${city.toLowerCase()}:${forecastDays}`
  const hit = cache[key]
  if (hit && Date.now() - hit.ts < TTL) return hit.data

  const geoRes = await fetch(`${GEO_URL}?name=${encodeURIComponent(city)}&count=1&language=pt`)
  const geoJson = await geoRes.json()
  if (!geoJson.results?.length) throw new Error('Cidade não encontrada')

  const { latitude: lat, longitude: lon } = geoJson.results[0]
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: 'temperature_2m,weathercode,windspeed_10m,relativehumidity_2m',
    daily: 'temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max',
    hourly: 'precipitation_probability,precipitation',
    timezone: 'auto',
    forecast_days: String(forecastDays),
  })
  const wRes = await fetch(`${WEATHER_URL}?${params}`)
  const w = await wRes.json()

  const data: WeatherData = {
    city,
    current: {
      temperature: Math.round(w.current.temperature_2m),
      weatherCode: w.current.weathercode,
      windspeed: Math.round(w.current.windspeed_10m),
      humidity: w.current.relativehumidity_2m,
    },
    daily: w.daily.time.map((date: string, i: number) => ({
      date,
      maxTemp: Math.round(w.daily.temperature_2m_max[i]),
      minTemp: Math.round(w.daily.temperature_2m_min[i]),
      weatherCode: w.daily.weathercode[i],
      precipitationProbability: w.daily.precipitation_probability_max[i],
    })),
    hourly: (w.hourly?.time ?? []).map((time: string, i: number) => ({
      time,
      precipProb: w.hourly.precipitation_probability[i] ?? 0,
      precip: Math.round((w.hourly.precipitation[i] ?? 0) * 10) / 10,
    })),
  }

  cache[key] = { data, ts: Date.now() }
  return data
}

function fetchWeather(city: string) { return fetchWeatherWithDays(city, 5) }

export type DayWeatherMap = Record<string, { min: number; max: number; code: number }>
export type CityWeatherMap = Record<string, WeatherData>

export function useWeather(city: string | null) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!city) return
    setLoading(true)
    setError(null)
    fetchWeather(city)
      .then(d => { setWeather(d); setLoading(false) })
      .catch(() => { setError('Não foi possível carregar o clima'); setLoading(false) })
  }, [city])

  return { weather, loading, error }
}

export function useTripWeather(days: { date: string; city: string }[]): { dayMap: DayWeatherMap; cityMap: CityWeatherMap } {
  const [dayMap, setDayMap] = useState<DayWeatherMap>({})
  const [cityMap, setCityMap] = useState<CityWeatherMap>({})
  const cityKey = [...new Set(days.map(d => d.city))].sort().join('|')

  useEffect(() => {
    if (!cityKey) return
    const cities = cityKey.split('|')
    cities.forEach(city => {
      fetchWeatherWithDays(city, 16)
        .then(data => {
          setDayMap(prev => {
            const next = { ...prev }
            data.daily.forEach(d => {
              next[`${city}:${d.date}`] = { min: d.minTemp, max: d.maxTemp, code: d.weatherCode }
            })
            return next
          })
          setCityMap(prev => ({ ...prev, [city]: data }))
        })
        .catch(() => {})
    })
  }, [cityKey])

  return { dayMap, cityMap }
}
