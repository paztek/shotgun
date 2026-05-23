import { create } from 'zustand'
import {
  getAllJourneys,
  getJourney,
  putJourney,
  putSegment,
  getSegmentsForJourney,
  deleteJourney as dbDeleteJourney,
  getActiveJourney,
} from '@/lib/db'
import { capturePosition } from '@/lib/geolocation'
import { generateId } from '@/lib/utils'
import type { Journey, Segment } from '@/types'

interface JourneysState {
  journeys: Journey[]
  activeJourney: Journey | null
  activeSegments: Segment[]
  loaded: boolean

  load: () => Promise<void>
  startJourney: (driverId: string) => Promise<Journey>
  switchDriver: (newDriverId: string) => Promise<void>
  endJourney: () => Promise<Journey>
  deleteJourney: (id: string) => Promise<void>
  updateJourney: (id: string, patch: Partial<Pick<Journey, 'label' | 'notes'>>) => Promise<void>
  getSegments: (journeyId: string) => Promise<Segment[]>
}

export const useJourneysStore = create<JourneysState>((set, get) => ({
  journeys: [],
  activeJourney: null,
  activeSegments: [],
  loaded: false,

  async load() {
    const [journeys, active] = await Promise.all([getAllJourneys(), getActiveJourney()])
    set({
      journeys,
      activeJourney: active?.journey ?? null,
      activeSegments: active?.segments ?? [],
      loaded: true,
    })
  },

  async startJourney(driverId) {
    const now = Date.now()
    const journey: Journey = {
      id: generateId(),
      startedAt: now,
      endedAt: null,
      startLocation: null,
      endLocation: null,
    }
    const segment: Segment = {
      id: generateId(),
      journeyId: journey.id,
      driverId,
      startedAt: now,
      endedAt: null,
    }
    await putJourney(journey)
    await putSegment(segment)
    set((s) => ({
      journeys: [journey, ...s.journeys],
      activeJourney: journey,
      activeSegments: [segment],
    }))

    // non-blocking geolocation
    capturePosition().then(async (loc) => {
      if (!loc) return
      const updated = { ...journey, startLocation: loc }
      await putJourney(updated)
      set((s) => ({
        activeJourney: s.activeJourney?.id === journey.id ? updated : s.activeJourney,
        journeys: s.journeys.map((j) => (j.id === journey.id ? updated : j)),
      }))
    })

    return journey
  },

  async switchDriver(newDriverId) {
    const { activeJourney, activeSegments } = get()
    if (!activeJourney) return
    const now = Date.now()

    const activeSegment = activeSegments.find((s) => s.endedAt === null)
    if (activeSegment) {
      const closed = { ...activeSegment, endedAt: now }
      await putSegment(closed)
      set((s) => ({
        activeSegments: s.activeSegments.map((seg) => (seg.id === activeSegment.id ? closed : seg)),
      }))
    }

    const newSegment: Segment = {
      id: generateId(),
      journeyId: activeJourney.id,
      driverId: newDriverId,
      startedAt: now,
      endedAt: null,
    }
    await putSegment(newSegment)
    set((s) => ({ activeSegments: [...s.activeSegments, newSegment] }))

    if (navigator.vibrate) navigator.vibrate(50)
  },

  async endJourney() {
    const { activeJourney, activeSegments } = get()
    if (!activeJourney) throw new Error('No active journey')
    const now = Date.now()

    const activeSegment = activeSegments.find((s) => s.endedAt === null)
    if (activeSegment) {
      const closed = { ...activeSegment, endedAt: now }
      await putSegment(closed)
    }

    const closedJourney = { ...activeJourney, endedAt: now }
    await putJourney(closedJourney)
    set((s) => ({
      activeJourney: null,
      activeSegments: [],
      journeys: s.journeys.map((j) => (j.id === closedJourney.id ? closedJourney : j)),
    }))

    capturePosition().then(async (loc) => {
      if (!loc) return
      const withEnd = { ...closedJourney, endLocation: loc }
      await putJourney(withEnd)
      set((s) => ({ journeys: s.journeys.map((j) => (j.id === withEnd.id ? withEnd : j)) }))
    })

    return closedJourney
  },

  async deleteJourney(id) {
    await dbDeleteJourney(id)
    set((s) => ({ journeys: s.journeys.filter((j) => j.id !== id) }))
  },

  async updateJourney(id, patch) {
    const journey = get().journeys.find((j) => j.id === id) ?? (await getJourney(id))
    if (!journey) return
    const updated = { ...journey, ...patch }
    await putJourney(updated)
    set((s) => ({ journeys: s.journeys.map((j) => (j.id === id ? updated : j)) }))
  },

  async getSegments(journeyId) {
    return getSegmentsForJourney(journeyId)
  },
}))
