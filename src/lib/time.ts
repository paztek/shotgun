import { format, formatDuration, intervalToDuration } from 'date-fns'

export function formatTimestamp(ms: number): string {
  return format(ms, 'dd MMM yyyy, HH:mm')
}

export function formatTimeOnly(ms: number): string {
  return format(ms, 'HH:mm')
}

export function formatDateOnly(ms: number): string {
  return format(ms, 'dd MMM yyyy')
}

export function formatElapsed(startMs: number, endMs: number = Date.now()): string {
  const duration = intervalToDuration({ start: startMs, end: endMs })
  const hours = Math.floor((endMs - startMs) / 3600000)
  if (hours > 0) {
    return formatDuration(duration, { format: ['hours', 'minutes', 'seconds'], zero: true })
  }
  return formatDuration(duration, { format: ['minutes', 'seconds'], zero: true })
}

export function formatElapsedShort(startMs: number, endMs: number = Date.now()): string {
  const totalSeconds = Math.floor((endMs - startMs) / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`
  return `${s}s`
}

export function formatDurationMs(ms: number): string {
  return formatElapsedShort(0, ms)
}
