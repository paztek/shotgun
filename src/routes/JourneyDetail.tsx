import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog'
import { SegmentTimeline } from '@/components/SegmentTimeline'
import { DriverBar } from '@/components/DriverBar'
import { useDriversStore } from '@/store/useDriversStore'
import { useJourneysStore } from '@/store/useJourneysStore'
import { getJourney, getSegmentsForJourney } from '@/lib/db'
import { formatTimestamp, formatDurationMs } from '@/lib/time'
import type { Journey, Segment } from '@/types'

function GeoLink({ lat, lng, accuracy }: { lat: number; lng: number; accuracy: number }) {
  const url = `https://www.google.com/maps?q=${lat},${lng}`
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
      {lat.toFixed(5)}, {lng.toFixed(5)} <span className="text-muted-foreground no-underline">(±{Math.round(accuracy)}m)</span>
    </a>
  )
}

export function JourneyDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { drivers } = useDriversStore()
  const { journeys, deleteJourney, updateJourney } = useJourneysStore()

  const [journey, setJourney] = useState<Journey | null>(null)
  const [segments, setSegments] = useState<Segment[]>([])
  const [label, setLabel] = useState('')
  const [notes, setNotes] = useState('')
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  useEffect(() => {
    if (!id) return
    async function load() {
      const j = journeys.find((x) => x.id === id) ?? await getJourney(id!)
      if (!j) return
      setJourney(j)
      setLabel(j.label ?? '')
      setNotes(j.notes ?? '')
      const segs = await getSegmentsForJourney(id!)
      setSegments(segs)
    }
    load()
  }, [id, journeys])

  async function handleLabelBlur() {
    if (!id) return
    await updateJourney(id, { label: label.trim() || undefined })
  }

  async function handleNotesBlur() {
    if (!id) return
    await updateJourney(id, { notes: notes.trim() || undefined })
  }

  async function handleDelete() {
    if (!id) return
    await deleteJourney(id)
    navigate('/history')
  }

  if (!journey) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Journey not found</p>
      </div>
    )
  }

  const duration = (journey.endedAt ?? Date.now()) - journey.startedAt

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-accent">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <input
            className="text-xl font-bold bg-transparent focus:outline-none w-full placeholder:text-muted-foreground/50"
            placeholder="Untitled journey"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleLabelBlur}
          />
          <p className="text-xs text-muted-foreground">{formatTimestamp(journey.startedAt)}</p>
        </div>
      </header>

      <main className="flex-1 px-5 pb-24 space-y-5">
        <div className="rounded-2xl border border-border bg-card p-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Duration</span>
          <span className="font-semibold tabular-nums">{formatDurationMs(duration)}</span>
        </div>

        {segments.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Driver breakdown</p>
            <DriverBar segments={segments} drivers={drivers} endedAt={journey.endedAt} />
          </div>
        )}

        {(journey.startLocation || journey.endLocation) && (
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> Locations
            </p>
            {journey.startLocation && (
              <div className="text-sm">
                <span className="text-muted-foreground mr-2">Start</span>
                <GeoLink {...journey.startLocation} />
              </div>
            )}
            {journey.endLocation && (
              <div className="text-sm">
                <span className="text-muted-foreground mr-2">End</span>
                <GeoLink {...journey.endLocation} />
              </div>
            )}
          </div>
        )}

        {segments.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Segments</p>
            <SegmentTimeline segments={segments} drivers={drivers} now={journey.endedAt ?? Date.now()} />
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2">Notes</p>
          <textarea
            className="w-full bg-transparent text-sm focus:outline-none resize-none placeholder:text-muted-foreground/50 min-h-[80px]"
            placeholder="Add notes about this journey…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleNotesBlur}
          />
        </div>

        <Button
          variant="outline"
          className="w-full rounded-xl text-destructive border-destructive/30 hover:bg-destructive/5"
          onClick={() => setConfirmDeleteOpen(true)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete journey
        </Button>
      </main>

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete journey?</DialogTitle>
            <DialogDescription>This will permanently remove this journey and all its segments.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <DialogClose asChild>
              <Button variant="outline" className="flex-1">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" className="flex-1" onClick={handleDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
