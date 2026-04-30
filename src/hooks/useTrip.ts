import { useState, useEffect, useCallback } from 'react'
import { Trip, Activity, Day, PendingItem, PendingStatus } from '../types'
import { defaultTrips } from '../data/defaultTrips'

const KEY = 'viaticum-v2'

interface AppState {
  trips: Trip[]
  activeTripId: string
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const state = JSON.parse(raw) as AppState
      // Inject any new default trips not yet in this device's storage
      const existingIds = new Set(state.trips.map(t => t.id))
      const newTrips = defaultTrips.filter(t => !existingIds.has(t.id))
      if (newTrips.length > 0) {
        return { ...state, trips: [...state.trips, ...newTrips] }
      }
      return state
    }
  } catch {}
  return { trips: defaultTrips, activeTripId: defaultTrips[0].id }
}

function nanoid(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function useTrip() {
  const [state, setState] = useState<AppState>(loadState)

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch {}
  }, [state])

  const trip = state.trips.find(t => t.id === state.activeTripId) ?? state.trips[0]

  const setActiveTrip = useCallback((id: string) => {
    setState(s => ({ ...s, activeTripId: id }))
  }, [])

  const updateActive = useCallback((updater: (t: Trip) => Trip) => {
    setState(s => ({
      ...s,
      trips: s.trips.map(t => t.id === s.activeTripId ? updater(t) : t),
    }))
  }, [])

  const toggleActivity = useCallback((dayId: string, actId: string) => {
    updateActive(t => ({
      ...t,
      days: t.days.map(d =>
        d.id !== dayId ? d : {
          ...d,
          activities: d.activities.map(a =>
            a.id !== actId ? a : { ...a, done: !a.done }
          ),
        }
      ),
    }))
  }, [updateActive])

  const saveActivity = useCallback((dayId: string, act: Activity) => {
    updateActive(t => ({
      ...t,
      days: t.days.map(d =>
        d.id !== dayId ? d : {
          ...d,
          activities: d.activities.some(a => a.id === act.id)
            ? d.activities.map(a => a.id === act.id ? act : a)
            : [...d.activities, act].sort((x, y) => x.time.localeCompare(y.time)),
        }
      ),
    }))
  }, [updateActive])

  const deleteActivity = useCallback((dayId: string, actId: string) => {
    updateActive(t => ({
      ...t,
      days: t.days.map(d =>
        d.id !== dayId ? d : {
          ...d,
          activities: d.activities.filter(a => a.id !== actId),
        }
      ),
    }))
  }, [updateActive])

  const addDay = useCallback((date: string, city: string, country: string) => {
    const newDay: Day = { id: nanoid(), date, city, country, activities: [] }
    updateActive(t => ({
      ...t,
      days: [...t.days, newDay].sort((a, b) => a.date.localeCompare(b.date)),
    }))
  }, [updateActive])

  const deleteDay = useCallback((dayId: string) => {
    updateActive(t => ({ ...t, days: t.days.filter(d => d.id !== dayId) }))
  }, [updateActive])

  const updateTripTitle = useCallback((title: string) => {
    updateActive(t => ({ ...t, title }))
  }, [updateActive])

  const newActivity = useCallback((_dayId: string): Activity => ({
    id: nanoid(),
    time: '09:00',
    title: '',
    description: '',
    location: '',
    done: false,
    type: 'attraction',
    notes: '',
  }), [])

  const togglePending = useCallback((itemId: string) => {
    updateActive(t => ({
      ...t,
      pendingItems: t.pendingItems.map(p =>
        p.id !== itemId ? p : {
          ...p,
          status: p.status === 'pendente' ? 'feito' : 'pendente' as PendingStatus,
        }
      ),
    }))
  }, [updateActive])

  const savePendingItem = useCallback((item: PendingItem) => {
    updateActive(t => ({
      ...t,
      pendingItems: t.pendingItems.some(p => p.id === item.id)
        ? t.pendingItems.map(p => p.id === item.id ? item : p)
        : [...t.pendingItems, item],
    }))
  }, [updateActive])

  const deletePendingItem = useCallback((itemId: string) => {
    updateActive(t => ({ ...t, pendingItems: t.pendingItems.filter(p => p.id !== itemId) }))
  }, [updateActive])

  const newPendingItem = useCallback((): PendingItem => ({
    id: nanoid(),
    title: '',
    dateNeeded: '',
    howTo: '',
    responsible: '',
    status: 'pendente',
    priority: 'normal',
    notes: '',
  }), [])

  const createTripWithDays = useCallback((title: string, days: Day[], pendingItems: PendingItem[] = []) => {
    const id = nanoid()
    setState(s => ({ trips: [...s.trips, { id, title, pendingItems, days }], activeTripId: id }))
  }, [])

  const createTrip = useCallback((title: string, firstCity: string, country: string, startDate: string) => {
    const id = nanoid()
    const newTrip: Trip = {
      id,
      title,
      pendingItems: [],
      days: [{
        id: nanoid(),
        date: startDate,
        city: firstCity,
        country,
        activities: [],
      }],
    }
    setState(s => ({ trips: [...s.trips, newTrip], activeTripId: id }))
  }, [])

  const updateTripMeta = useCallback((id: string, title: string, color?: string) => {
    setState(s => ({
      ...s,
      trips: s.trips.map(t => t.id === id ? { ...t, title, ...(color !== undefined && { color }) } : t),
    }))
  }, [])

  const deleteTrip = useCallback((id: string) => {
    setState(s => {
      const remaining = s.trips.filter(t => t.id !== id)
      if (!remaining.length) return s
      return {
        trips: remaining,
        activeTripId: s.activeTripId === id ? remaining[0].id : s.activeTripId,
      }
    })
  }, [])

  const importTrip = useCallback((data: Omit<Trip, 'id'>) => {
    const id = nanoid()
    setState(s => ({
      trips: [...s.trips, { ...data, id }],
      activeTripId: id,
    }))
  }, [])

  const moveActivity = useCallback((fromDayId: string, toDayId: string, act: Activity) => {
    updateActive(t => ({
      ...t,
      days: t.days.map(d => {
        if (d.id === fromDayId) return { ...d, activities: d.activities.filter(a => a.id !== act.id) }
        if (d.id === toDayId) return { ...d, activities: [...d.activities, act].sort((x, y) => x.time.localeCompare(y.time)) }
        return d
      }),
    }))
  }, [updateActive])

  const reorderTrips = useCallback((ids: string[]) => {
    setState(s => {
      const order = new Map(ids.map((id, i) => [id, i]))
      return {
        ...s,
        trips: [...s.trips].sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999)),
      }
    })
  }, [])

  return {
    trips: state.trips,
    activeTripId: state.activeTripId,
    trip,
    setActiveTrip,
    toggleActivity,
    saveActivity,
    deleteActivity,
    addDay,
    deleteDay,
    updateTripTitle,
    newActivity,
    togglePending,
    savePendingItem,
    deletePendingItem,
    newPendingItem,
    createTrip,
    createTripWithDays,
    updateTripMeta,
    deleteTrip,
    importTrip,
    reorderTrips,
    moveActivity,
  }
}
