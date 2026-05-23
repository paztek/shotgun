import { useRef, useState } from 'react'
import { Download, Upload, Trash2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog'
import { DriverPickerSheet } from '@/components/DriverPickerSheet'
import { useToast } from '@/components/ui/toast'
import { useDriversStore } from '@/store/useDriversStore'
import { useJourneysStore } from '@/store/useJourneysStore'
import { downloadExport, importFromFile } from '@/lib/export'
import { wipeAll } from '@/lib/db'

export function Settings() {
  const { toast } = useToast()
  const { drivers } = useDriversStore()
  const { load } = useJourneysStore()
  const { load: loadDrivers } = useDriversStore()

  const [wipeConfirm, setWipeConfirm] = useState(false)
  const [wipeInput, setWipeInput] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const [geoStatus, setGeoStatus] = useState<PermissionState | 'unsupported'>(() => {
    if (!navigator.geolocation) return 'unsupported'
    return 'prompt'
  })

  async function requestGeo() {
    try {
      await new Promise<void>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(() => resolve(), reject, { timeout: 5000 }),
      )
      setGeoStatus('granted')
      toast('Location access granted')
    } catch {
      setGeoStatus('denied')
      toast('Location access denied')
    }
  }

  async function handleExport() {
    await downloadExport()
    toast('Export downloaded')
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await importFromFile(file)
      await Promise.all([loadDrivers(), load()])
      toast('Import complete')
    } catch {
      toast('Import failed — invalid file')
    }
    e.target.value = ''
  }

  async function handleWipe() {
    if (wipeInput !== 'WIPE') return
    await wipeAll()
    await Promise.all([loadDrivers(), load()])
    setWipeConfirm(false)
    setWipeInput('')
    toast('All data wiped')
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-5 pt-12 pb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
      </header>

      <main className="flex-1 px-5 pb-24 space-y-6">
        <section className="space-y-3">
          <h2 className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Drivers ({drivers.length})</h2>
          <div className="rounded-2xl border border-border bg-card p-4">
            <DriverPickerSheet
              onSelect={() => {}}
              onClose={() => {}}
            />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Location</h2>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Geolocation</p>
                <p className="text-xs text-muted-foreground capitalize">{geoStatus === 'unsupported' ? 'Not supported' : geoStatus}</p>
              </div>
              {geoStatus !== 'granted' && geoStatus !== 'unsupported' && (
                <Button size="sm" variant="outline" onClick={requestGeo}>Request</Button>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Data</h2>
          <div className="rounded-2xl border border-border bg-card divide-y divide-border">
            <button
              className="flex items-center gap-3 w-full px-4 py-4 text-sm hover:bg-accent transition-colors"
              onClick={handleExport}
            >
              <Download className="h-4 w-4 text-muted-foreground" />
              Export all data
            </button>
            <button
              className="flex items-center gap-3 w-full px-4 py-4 text-sm hover:bg-accent transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-4 w-4 text-muted-foreground" />
              Import from file
            </button>
            <button
              className="flex items-center gap-3 w-full px-4 py-4 text-sm text-destructive hover:bg-destructive/5 transition-colors"
              onClick={() => setWipeConfirm(true)}
            >
              <Trash2 className="h-4 w-4" />
              Wipe all data
            </button>
          </div>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        </section>

        <section className="space-y-3">
          <h2 className="text-xs text-muted-foreground uppercase tracking-wide font-medium">About</h2>
          <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
            <Info className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-medium">Shotgun v1.0</p>
              <p className="text-xs text-muted-foreground">Driver log · No account, no server, no tracking.</p>
            </div>
          </div>
        </section>
      </main>

      <Dialog open={wipeConfirm} onOpenChange={setWipeConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Wipe all data?</DialogTitle>
            <DialogDescription>
              This permanently deletes all drivers, journeys, and segments. Type <strong>WIPE</strong> to confirm.
            </DialogDescription>
          </DialogHeader>
          <input
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-3 focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Type WIPE"
            value={wipeInput}
            onChange={(e) => setWipeInput(e.target.value)}
          />
          <div className="flex gap-3 mt-4">
            <DialogClose asChild>
              <Button variant="outline" className="flex-1">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" className="flex-1" disabled={wipeInput !== 'WIPE'} onClick={handleWipe}>
              Wipe
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
