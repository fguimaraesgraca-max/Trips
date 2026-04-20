import { useState, useEffect, useCallback } from 'react'
import { Trip, Activity, Day } from '../types'
import { sampleTrip } from '../data/sampleTrip'

const KEY = 'viaticum-v1'

function load(): Trip {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as Trip
  } catch {}
  return sampleTrip
}

function nanoid(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function useTrip() {
  const [trip, setTrip] = useState<Trip>(load)

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(trip)) } catch {}
  }, [trip])

  const toggleActivity = useCallback((dayId: string, actId: string) => {
    setTrip(p => ({
      ...p,
      days: p.days.map(d =>
        d.id !== dayId ? d : {
          ...d,
          activities: d.activities.map(a =>
            a.id !== actId ? a : { ...a, done: !a.done }
          ),
        }
      ),
    }))
  }, [])

  const saveActivity = useCallback((dayId: string, act: Activity) => {
    setTrip(p => ({
      ...p,
      days: p.days.map(d =>
        d.id !== dayId ? d : {
          ...d,
          activities: d.activities.some(a => a.id === act.id)
            ? d.activities.map(a => a.id === act.id ? act : a)
            : [...d.activities, act].sort((x, y) => x.time.localeCompare(y.time)),
        }
      ),
    }))
  }, [])

  const deleteActivity = useCallback((dayId: string, actId: string) => {
    setTrip(p => ({
      ...p,
      days: p.days.map(d =>
        d.id !== dayId ? d : {
          ...d,
          activities: d.activities.filter(a => a.id !== actId),
        }
      ),
    }))
  }, [])

  const addDay = useCallback((date: string, city: string, country: string) => {
    const newDay: Day = { id: nanoid(), date, city, country, activities: [] }
    setTrip(p => ({
      ...p,
      days: [...p.days, newDay].sort((a, b) => a.date.localeCompare(b.date)),
    }))
  }, [])

  const deleteDay = useCallback((dayId: string) => {
    setTrip(p => ({ ...p, days: p.days.filter(d => d.id !== dayId) }))
  }, [])

  const updateTripTitle = useCallback((title: string) => {
    setTrip(p => ({ ...p, title }))
  }, [])

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

  const resetTrip = useCallback(() => {
    setTrip(sampleTrip)
  }, [])

  return {
    trip,
    toggleActivity,
    saveActivity,
    deleteActivity,
    addDay,
    deleteDay,
    updateTripTitle,
    newActivity,
    resetTrip,
  }
}
