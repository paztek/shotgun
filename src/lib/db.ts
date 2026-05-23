import { openDB, type IDBPDatabase } from 'idb'
import type { Driver, Journey, Segment } from '@/types'

interface ShotgunDB {
  drivers: {
    key: string
    value: Driver
    indexes: { createdAt: number }
  }
  journeys: {
    key: string
    value: Journey
    indexes: { startedAt: number }
  }
  segments: {
    key: string
    value: Segment
    indexes: { journeyId: string; startedAt: number }
  }
}

let dbInstance: IDBPDatabase<ShotgunDB> | null = null

async function getDB(): Promise<IDBPDatabase<ShotgunDB>> {
  if (dbInstance) return dbInstance
  dbInstance = await openDB<ShotgunDB>('shotgun', 1, {
    upgrade(db) {
      const driverStore = db.createObjectStore('drivers', { keyPath: 'id' })
      driverStore.createIndex('createdAt', 'createdAt')

      const journeyStore = db.createObjectStore('journeys', { keyPath: 'id' })
      journeyStore.createIndex('startedAt', 'startedAt')

      const segmentStore = db.createObjectStore('segments', { keyPath: 'id' })
      segmentStore.createIndex('journeyId', 'journeyId')
      segmentStore.createIndex('startedAt', 'startedAt')
    },
  })
  return dbInstance
}

export async function getAllDrivers(): Promise<Driver[]> {
  const db = await getDB()
  return db.getAllFromIndex('drivers', 'createdAt')
}

export async function putDriver(driver: Driver): Promise<void> {
  const db = await getDB()
  await db.put('drivers', driver)
}

export async function getAllJourneys(): Promise<Journey[]> {
  const db = await getDB()
  const all = await db.getAllFromIndex('journeys', 'startedAt')
  return all.reverse()
}

export async function getJourney(id: string): Promise<Journey | undefined> {
  const db = await getDB()
  return db.get('journeys', id)
}

export async function putJourney(journey: Journey): Promise<void> {
  const db = await getDB()
  await db.put('journeys', journey)
}

export async function deleteJourney(id: string): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(['journeys', 'segments'], 'readwrite')
  await tx.objectStore('journeys').delete(id)
  const segments = await tx.objectStore('segments').index('journeyId').getAll(id)
  for (const seg of segments) {
    await tx.objectStore('segments').delete(seg.id)
  }
  await tx.done
}

export async function getSegmentsForJourney(journeyId: string): Promise<Segment[]> {
  const db = await getDB()
  return db.getAllFromIndex('segments', 'journeyId', journeyId)
}

export async function putSegment(segment: Segment): Promise<void> {
  const db = await getDB()
  await db.put('segments', segment)
}

export async function getActiveJourney(): Promise<{ journey: Journey; segments: Segment[] } | null> {
  const db = await getDB()
  const journeys = await db.getAllFromIndex('journeys', 'startedAt')
  const journey = journeys.find((j) => j.endedAt === null) ?? null
  if (!journey) return null
  const segments = await db.getAllFromIndex('segments', 'journeyId', journey.id)
  return { journey, segments }
}

export async function exportAll(): Promise<{ drivers: Driver[]; journeys: Journey[]; segments: Segment[] }> {
  const db = await getDB()
  const [drivers, journeys, segments] = await Promise.all([
    db.getAll('drivers'),
    db.getAll('journeys'),
    db.getAll('segments'),
  ])
  return { drivers, journeys, segments }
}

export async function importAll(data: { drivers: Driver[]; journeys: Journey[]; segments: Segment[] }): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(['drivers', 'journeys', 'segments'], 'readwrite')
  for (const d of data.drivers) await tx.objectStore('drivers').put(d)
  for (const j of data.journeys) await tx.objectStore('journeys').put(j)
  for (const s of data.segments) await tx.objectStore('segments').put(s)
  await tx.done
}

export async function wipeAll(): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(['drivers', 'journeys', 'segments'], 'readwrite')
  await tx.objectStore('drivers').clear()
  await tx.objectStore('journeys').clear()
  await tx.objectStore('segments').clear()
  await tx.done
}
