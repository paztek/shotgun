import { format } from 'date-fns'
import { exportAll, importAll } from './db'
import type { Driver, Journey, Segment } from '@/types'

export async function downloadExport(): Promise<void> {
  const data = await exportAll()
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `shotgun-export-${format(Date.now(), 'yyyy-MM-dd')}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importFromFile(file: File): Promise<void> {
  const text = await file.text()
  const data = JSON.parse(text) as { drivers: Driver[]; journeys: Journey[]; segments: Segment[] }
  await importAll(data)
}
