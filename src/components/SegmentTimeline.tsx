import { formatTimeOnly, formatDurationMs } from '@/lib/time'
import { DriverAvatar } from './DriverAvatar'
import type { Driver, Segment } from '@/types'

interface SegmentTimelineProps {
  segments: Segment[]
  drivers: Driver[]
  now?: number
}

export function SegmentTimeline({ segments, drivers, now = Date.now() }: SegmentTimelineProps) {
  if (segments.length === 0) return null

  return (
    <ol className="space-y-2">
      {segments.map((seg) => {
        const driver = drivers.find((d) => d.id === seg.driverId)
        if (!driver) return null
        const end = seg.endedAt ?? now
        const duration = end - seg.startedAt
        const isActive = seg.endedAt === null

        return (
          <li key={seg.id} className="flex items-center gap-3 text-sm">
            <DriverAvatar driver={driver} size="sm" />
            <span className="font-medium flex-1">{driver.name}</span>
            <span className="text-muted-foreground tabular-nums">
              {formatTimeOnly(seg.startedAt)} {seg.endedAt ? `→ ${formatTimeOnly(seg.endedAt)}` : '→ now'}
            </span>
            <span className={`tabular-nums text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
              {formatDurationMs(duration)}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
