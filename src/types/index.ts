export type ActivityType =
  | 'flight'
  | 'hotel'
  | 'food'
  | 'attraction'
  | 'transport'
  | 'shopping'
  | 'other'

export type TipCategory = 'food' | 'transport' | 'culture' | 'safety' | 'general' | 'budget' | 'restaurant'

export type TipSource = 'TripAdvisor' | 'Google' | 'Booking' | 'Viajante'

export type PendingStatus = 'pendente' | 'feito'
export type PendingPriority = 'critico' | 'importante' | 'normal'

export interface Activity {
  id: string
  time: string
  title: string
  description: string
  location: string
  done: boolean
  type: ActivityType
  notes: string
}

export interface Day {
  id: string
  date: string // YYYY-MM-DD
  city: string
  country: string
  activities: Activity[]
}

export interface PendingItem {
  id: string
  title: string
  dateNeeded: string   // human-readable, e.g. "Qua 29/04 — MADRUGADA"
  howTo: string
  responsible: string
  status: PendingStatus
  priority: PendingPriority
  notes: string
}

export interface Trip {
  id: string
  title: string
  days: Day[]
  pendingItems: PendingItem[]
}

export interface WeatherCurrent {
  temperature: number
  weatherCode: number
  windspeed: number
  humidity: number
}

export interface WeatherDay {
  date: string
  maxTemp: number
  minTemp: number
  weatherCode: number
  precipitationProbability: number
}

export interface WeatherData {
  city: string
  current: WeatherCurrent
  daily: WeatherDay[]
}

export interface Tip {
  id: string
  text: string
  author: string
  source: TipSource
  rating: number
  category: TipCategory
  city?: string
}
