import { create } from 'zustand'
import { getAllDrivers, putDriver } from '@/lib/db'
import { assignColor } from '@/lib/colors'
import { generateId } from '@/lib/utils'
import type { Driver } from '@/types'

interface DriversState {
  drivers: Driver[]
  loaded: boolean
  load: () => Promise<void>
  addDriver: (name: string) => Promise<Driver>
  updateDriver: (id: string, patch: Partial<Pick<Driver, 'name' | 'color' | 'archived'>>) => Promise<void>
}

export const useDriversStore = create<DriversState>((set, get) => ({
  drivers: [],
  loaded: false,

  async load() {
    const drivers = await getAllDrivers()
    set({ drivers, loaded: true })
  },

  async addDriver(name) {
    const { drivers } = get()
    const color = assignColor(drivers.length)
    const driver: Driver = {
      id: generateId(),
      name,
      color,
      createdAt: Date.now(),
      archived: false,
    }
    await putDriver(driver)
    set({ drivers: [...drivers, driver] })
    return driver
  },

  async updateDriver(id, patch) {
    const { drivers } = get()
    const driver = drivers.find((d) => d.id === id)
    if (!driver) return
    const updated = { ...driver, ...patch }
    await putDriver(updated)
    set({ drivers: drivers.map((d) => (d.id === id ? updated : d)) })
  },
}))
