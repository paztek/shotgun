import type { Driver, Segment } from '@/types'

interface DriverBarProps {
  segments: Segment[]
  drivers: Driver[]
  endedAt: number | null
}

export function DriverBar({ segments, drivers, endedAt }: DriverBarProps) {
  if (segments.length === 0) return null

  const now = Date.now()
  const total = segments.reduce((acc, s) => acc + ((s.endedAt ?? endedAt ?? now) - s.startedAt), 0)
  if (total === 0) return null

  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full gap-px">
      {segments.map((seg) => {
        const driver = drivers.find((d) => d.id === seg.driverId)
        const duration = (seg.endedAt ?? endedAt ?? now) - seg.startedAt
        const pct = (duration / total) * 100
        return (
          <div
            key={seg.id}
            className="h-full rounded-sm"
            style={{ width: `${pct}%`, backgroundColor: driver?.color ?? '#ccc' }}
            title={`${driver?.name ?? 'Unknown'}: ${Math.round(pct)}%`}
          />
        )
      })}
    </div>
  )
}
