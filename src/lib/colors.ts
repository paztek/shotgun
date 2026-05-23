export const DRIVER_PALETTE = [
  '#2563eb', // blue
  '#dc2626', // red
  '#16a34a', // green
  '#d97706', // amber
  '#7c3aed', // violet
  '#db2777', // pink
  '#0891b2', // cyan
  '#ea580c', // orange
]

export function assignColor(index: number): string {
  return DRIVER_PALETTE[index % DRIVER_PALETTE.length]
}
