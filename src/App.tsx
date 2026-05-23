import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { Home as HomeIcon, Clock, Settings as SettingsIcon } from 'lucide-react'
import { ToastProvider } from '@/components/ui/toast'
import { Home } from '@/routes/Home'
import { History } from '@/routes/History'
import { JourneyDetail } from '@/routes/JourneyDetail'
import { Settings } from '@/routes/Settings'
import { useDriversStore } from '@/store/useDriversStore'
import { useJourneysStore } from '@/store/useJourneysStore'
import { cn } from '@/lib/utils'

function ThemeSync() {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = (dark: boolean) => document.documentElement.classList.toggle('dark', dark)
    apply(mq.matches)
    mq.addEventListener('change', (e) => apply(e.matches))
  }, [])
  return null
}

function BottomNav() {
  const location = useLocation()
  if (location.pathname.startsWith('/journey/')) return null

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] border-t border-border bg-background/90 backdrop-blur-sm">
      <div className="flex">
        {[
          { to: '/', icon: HomeIcon, label: 'Home' },
          { to: '/history', icon: Clock, label: 'History' },
          { to: '/settings', icon: SettingsIcon, label: 'Settings' },
        ].map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

function AppLoader({ children }: { children: React.ReactNode }) {
  const { load: loadDrivers, loaded: driversLoaded } = useDriversStore()
  const { load: loadJourneys, loaded: journeysLoaded } = useJourneysStore()

  useEffect(() => {
    loadDrivers()
    loadJourneys()
  }, [loadDrivers, loadJourneys])

  if (!driversLoaded || !journeysLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeSync />
      <ToastProvider>
        <AppLoader>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/history" element={<History />} />
            <Route path="/journey/:id" element={<JourneyDetail />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
          <BottomNav />
        </AppLoader>
      </ToastProvider>
    </BrowserRouter>
  )
}
