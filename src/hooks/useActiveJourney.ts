import { useJourneysStore } from '@/store/useJourneysStore'
import { useDriversStore } from '@/store/useDriversStore'
import type { Driver, Segment } from '@/types'

export interface ActiveJourneyInfo {
  activeSegment: Segment | null
  activeDriver: Driver | null
}

export function useActiveJourney(): ActiveJourneyInfo {
  const activeSegments = useJourneysStore((s) => s.activeSegments)
  const drivers = useDriversStore((s) => s.drivers)
  const activeSegment = activeSegments.find((s) => s.endedAt === null) ?? null
  const activeDriver = activeSegment ? (drivers.find((d) => d.id === activeSegment.driverId) ?? null) : null
  return { activeSegment, activeDriver }
}
