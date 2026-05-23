import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Car, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog'
import { DurationCounter } from '@/components/DurationCounter'
import { DriverAvatar } from '@/components/DriverAvatar'
import { DriverPickerSheet } from '@/components/DriverPickerSheet'
import { JourneyListItem } from '@/components/JourneyListItem'
import { SegmentTimeline } from '@/components/SegmentTimeline'
import { useActiveJourney } from '@/hooks/useActiveJourney'
import { useToast } from '@/components/ui/toast'
import { useDriversStore } from '@/store/useDriversStore'
import { useJourneysStore } from '@/store/useJourneysStore'
import { getSegmentsForJourney } from '@/lib/db'
import { useTick } from '@/hooks/useTick'
import type { Driver, Segment } from '@/types'

export function Home() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const now = useTick()

  const { drivers } = useDriversStore()
  const { journeys, activeJourney, activeSegments, startJourney, switchDriver, endJourney } = useJourneysStore()

  const { activeDriver } = useActiveJourney()

  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerMode, setPickerMode] = useState<'start' | 'switch'>('start')
  const [confirmEndOpen, setConfirmEndOpen] = useState(false)

  const recentJourneys = journeys.filter((j) => j.endedAt !== null).slice(0, 3)
  const [recentSegments, setRecentSegments] = useState<Record<string, Segment[]>>({})

  useEffect(() => {
    async function load() {
      const entries = await Promise.all(recentJourneys.map(async (j) => [j.id, await getSegmentsForJourney(j.id)] as const))
      setRecentSegments(Object.fromEntries(entries))
    }
    if (recentJourneys.length > 0) load()
  }, [journeys])

  function openStartPicker() {
    if (drivers.filter((d) => !d.archived).length === 0) {
      toast('Add a driver first in Settings')
      return
    }
    setPickerMode('start')
    setPickerOpen(true)
  }

  async function handleDriverSelect(driver: Driver) {
    if (pickerMode === 'start') {
      await startJourney(driver.id)
      toast(`Journey started · ${driver.name} is driving`)
    } else {
      await switchDriver(driver.id)
      toast(`Driver: ${driver.name}`)
    }
  }

  async function handleEndJourney() {
    const journey = await endJourney()
    setConfirmEndOpen(false)
    navigate(`/journey/${journey.id}`)
  }

  if (!activeJourney) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <header className="px-5 pt-12 pb-6">
          <h1 className="text-2xl font-bold">Shotgun</h1>
          <p className="text-muted-foreground text-sm mt-1">Track who's driving</p>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-5 gap-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Car className="h-10 w-10 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold">Ready to roll?</p>
              <p className="text-muted-foreground text-sm">Tap below to record who's behind the wheel.</p>
            </div>
          </div>
          <Button size="lg" className="w-full max-w-xs rounded-2xl" onClick={openStartPicker}>
            Start a new journey
          </Button>
        </main>

        {recentJourneys.length > 0 && (
          <section className="px-5 pb-24">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Recent journeys</h2>
              <button className="text-sm text-primary flex items-center gap-1" onClick={() => navigate('/history')}>
                See all <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-3">
              {recentJourneys.map((j) => (
                <JourneyListItem key={j.id} journey={j} segments={recentSegments[j.id] ?? []} drivers={drivers} />
              ))}
            </div>
          </section>
        )}

        <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Who's driving?</DialogTitle>
              <DialogDescription>Select the driver to start the journey.</DialogDescription>
            </DialogHeader>
            <DriverPickerSheet
              onSelect={handleDriverSelect}
              onClose={() => setPickerOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-5 pt-12 pb-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Journey in progress</p>
        <DurationCounter startedAt={activeJourney.startedAt} className="text-4xl font-bold tabular-nums" />
      </header>

      <main className="flex-1 flex flex-col px-5 gap-5">
        {activeDriver && (
          <div className="rounded-2xl border border-border bg-card p-5 flex flex-col items-center gap-3">
            <DriverAvatar driver={activeDriver} size="xl" />
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Currently driving</p>
              <p className="text-2xl font-bold mt-0.5">{activeDriver.name}</p>
            </div>
            <Button
              variant="outline"
              className="w-full rounded-xl"
              onClick={() => { setPickerMode('switch'); setPickerOpen(true) }}
            >
              Switch driver
            </Button>
          </div>
        )}

        {activeSegments.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-3">This journey</p>
            <SegmentTimeline segments={activeSegments} drivers={drivers} now={now} />
          </div>
        )}
      </main>

      <div className="px-5 pb-8 pt-4">
        <Button
          variant="destructive"
          size="lg"
          className="w-full rounded-2xl"
          onClick={() => setConfirmEndOpen(true)}
        >
          End journey
        </Button>
      </div>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch driver</DialogTitle>
            <DialogDescription>Select the new driver for this journey.</DialogDescription>
          </DialogHeader>
          <DriverPickerSheet
            onSelect={handleDriverSelect}
            currentDriverId={activeDriver?.id}
            onClose={() => setPickerOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={confirmEndOpen} onOpenChange={setConfirmEndOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End journey?</DialogTitle>
            <DialogDescription>This will close the current journey and save it to history.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <DialogClose asChild>
              <Button variant="outline" className="flex-1">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" className="flex-1" onClick={handleEndJourney}>
              End journey
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
