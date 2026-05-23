import { Link } from 'react-router-dom'
import { formatDateOnly, formatTimeOnly, formatDurationMs } from '@/lib/time'
import { DriverBar } from './DriverBar'
import type { Driver, Journey, Segment } from '@/types'

interface JourneyListItemProps {
  journey: Journey
  segments: Segment[]
  drivers: Driver[]
}

export function JourneyListItem({ journey, segments, drivers }: JourneyListItemProps) {
  const duration = (journey.endedAt ?? Date.now()) - journey.startedAt

  return (
    <Link
      to={`/journey/${journey.id}`}
      className="block rounded-2xl border border-border bg-card p-4 hover:bg-accent/30 transition-colors active:bg-accent/50"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="font-semibold text-sm">{journey.label ?? 'Untitled journey'}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatDateOnly(journey.startedAt)} · {formatTimeOnly(journey.startedAt)}
            {journey.endedAt ? ` → ${formatTimeOnly(journey.endedAt)}` : ''}
          </p>
        </div>
        <span className="text-xs tabular-nums bg-muted px-2 py-1 rounded-full text-muted-foreground shrink-0">
          {formatDurationMs(duration)}
        </span>
      </div>
      <DriverBar segments={segments} drivers={drivers} endedAt={journey.endedAt} />
    </Link>
  )
}
