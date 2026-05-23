export interface GeoPoint {
  lat: number
  lng: number
  accuracy: number
  capturedAt: number
}

export interface Driver {
  id: string
  name: string
  color: string
  createdAt: number
  archived: boolean
}

export interface Journey {
  id: string
  startedAt: number
  endedAt: number | null
  startLocation: GeoPoint | null
  endLocation: GeoPoint | null
  label?: string
  notes?: string
}

export interface Segment {
  id: string
  journeyId: string
  driverId: string
  startedAt: number
  endedAt: number | null
}
