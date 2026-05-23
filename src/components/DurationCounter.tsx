import { useTick } from '@/hooks/useTick'

interface DurationCounterProps {
  startedAt: number
  className?: string
}

export function DurationCounter({ startedAt, className }: DurationCounterProps) {
  const now = useTick()
  const totalSeconds = Math.floor((now - startedAt) / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60

  const display = [h > 0 ? String(h).padStart(2, '0') : null, String(m).padStart(2, '0'), String(s).padStart(2, '0')]
    .filter(Boolean)
    .join(':')

  return <span className={className}>{display}</span>
}
