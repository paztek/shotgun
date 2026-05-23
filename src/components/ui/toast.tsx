import * as ToastPrimitive from '@radix-ui/react-toast'
import { X } from 'lucide-react'
import { createContext, useContext, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface ToastItem {
  id: number
  message: string
}

interface ToastContextValue {
  toast: (message: string) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback((message: string) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        {toasts.map((t) => (
          <ToastPrimitive.Root
            key={t.id}
            open
            className={cn(
              'fixed bottom-20 left-1/2 z-[100] -translate-x-1/2 flex items-center gap-3 rounded-xl bg-foreground px-4 py-3 text-sm text-background shadow-lg',
              'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in',
            )}
          >
            <ToastPrimitive.Description>{t.message}</ToastPrimitive.Description>
            <ToastPrimitive.Close>
              <X className="h-3.5 w-3.5 opacity-60" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  )
}
