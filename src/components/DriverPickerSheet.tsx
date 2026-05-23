import { useState } from 'react'
import { Check, Plus, Pencil, Archive, ArchiveRestore } from 'lucide-react'
import { Button } from './ui/button'
import { DriverAvatar } from './DriverAvatar'
import { useDriversStore } from '@/store/useDriversStore'
import type { Driver } from '@/types'

interface DriverPickerSheetProps {
  onSelect: (driver: Driver) => void
  currentDriverId?: string
  onClose: () => void
}

export function DriverPickerSheet({ onSelect, currentDriverId, onClose }: DriverPickerSheetProps) {
  const { drivers, addDriver, updateDriver } = useDriversStore()
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const active = drivers.filter((d) => !d.archived)

  async function handleAdd() {
    const name = newName.trim()
    if (!name) return
    const driver = await addDriver(name)
    setNewName('')
    setAdding(false)
    onSelect(driver)
    onClose()
  }

  async function handleEdit(id: string) {
    const name = editName.trim()
    if (!name) return
    await updateDriver(id, { name })
    setEditingId(null)
  }

  return (
    <div className="flex flex-col gap-1 max-h-[70vh] overflow-y-auto">
      {active.map((driver) => (
        <div key={driver.id} className="group">
          {editingId === driver.id ? (
            <div className="flex gap-2 items-center px-2 py-2">
              <DriverAvatar driver={driver} size="sm" />
              <input
                autoFocus
                className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleEdit(driver.id); if (e.key === 'Escape') setEditingId(null) }}
              />
              <Button size="sm" onClick={() => handleEdit(driver.id)}>Save</Button>
            </div>
          ) : (
            <button
              className="flex items-center gap-3 w-full rounded-xl px-3 py-3.5 text-left hover:bg-accent transition-colors min-h-[56px]"
              onClick={() => { onSelect(driver); onClose() }}
            >
              <DriverAvatar driver={driver} size="md" />
              <span className="flex-1 font-medium">{driver.name}</span>
              {currentDriverId === driver.id && <Check className="h-4 w-4 text-primary" />}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                <button
                  className="p-1.5 rounded-md hover:bg-muted"
                  onClick={() => { setEditingId(driver.id); setEditName(driver.name) }}
                  aria-label="Edit driver"
                >
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <button
                  className="p-1.5 rounded-md hover:bg-muted"
                  onClick={() => updateDriver(driver.id, { archived: true })}
                  aria-label="Archive driver"
                >
                  <Archive className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            </button>
          )}
        </div>
      ))}

      {drivers.filter((d) => d.archived).length > 0 && (
        <details className="mt-2">
          <summary className="text-xs text-muted-foreground px-3 py-1 cursor-pointer">Archived drivers</summary>
          {drivers.filter((d) => d.archived).map((driver) => (
            <div key={driver.id} className="flex items-center gap-3 px-3 py-2 opacity-60">
              <DriverAvatar driver={driver} size="sm" />
              <span className="flex-1 text-sm">{driver.name}</span>
              <button
                className="p-1.5 rounded-md hover:bg-muted"
                onClick={() => updateDriver(driver.id, { archived: false })}
                aria-label="Unarchive driver"
              >
                <ArchiveRestore className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </details>
      )}

      <div className="mt-2 border-t border-border pt-3">
        {adding ? (
          <div className="flex gap-2 items-center px-2">
            <input
              autoFocus
              placeholder="Driver name"
              className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false) }}
            />
            <Button size="sm" onClick={handleAdd}>Add</Button>
          </div>
        ) : (
          <button
            className="flex items-center gap-3 w-full rounded-xl px-3 py-3 text-sm text-primary hover:bg-primary/5 transition-colors"
            onClick={() => setAdding(true)}
          >
            <Plus className="h-4 w-4" />
            Add new driver
          </button>
        )}
      </div>
    </div>
  )
}
