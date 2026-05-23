import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { JourneyListItem } from '@/components/JourneyListItem'
import { useDriversStore } from '@/store/useDriversStore'
import { useJourneysStore } from '@/store/useJourneysStore'
import { getSegmentsForJourney } from '@/lib/db'
import type { Segment } from '@/types'

export function History() {
  const { drivers } = useDriversStore()
  const { journeys } = useJourneysStore()
  const [segmentMap, setSegmentMap] = useState<Record<string, Segment[]>>({})

  const ended = journeys.filter((j) => j.endedAt !== null)

  useEffect(() => {
    async function loadSegments() {
      const entries = await Promise.all(ended.map(async (j) => [j.id, await getSegmentsForJourney(j.id)] as const))
      setSegmentMap(Object.fromEntries(entries))
    }
    loadSegments()
  }, [journeys])

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-5 pt-12 pb-6">
        <h1 className="text-2xl font-bold">History</h1>
        <p className="text-muted-foreground text-sm mt-1">{ended.length} journey{ended.length !== 1 ? 's' : ''}</p>
      </header>

      <main className="flex-1 px-5 pb-24">
        {ended.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
            <Clock className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">No completed journeys yet.<br />Start your first one on the home screen.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ended.map((j) => (
              <JourneyListItem
                key={j.id}
                journey={j}
                segments={segmentMap[j.id] ?? []}
                drivers={drivers}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
