import { cn } from '@/lib/utils'
import type { Driver } from '@/types'

interface DriverAvatarProps {
  driver: Driver
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-xl',
  xl: 'h-24 w-24 text-3xl',
}

export function DriverAvatar({ driver, size = 'md', className }: DriverAvatarProps) {
  const initials = driver.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      className={cn('rounded-full flex items-center justify-center font-bold text-white select-none', sizeClasses[size], className)}
      style={{ backgroundColor: driver.color }}
    >
      {initials}
    </div>
  )
}
