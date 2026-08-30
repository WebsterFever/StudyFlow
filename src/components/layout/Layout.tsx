import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Moon, Pause, Play, Sun, Timer as TimerIcon } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { NAV_ITEMS } from './navConfig'
import { useStudy } from '../../hooks/useStudy'
import { useTheme } from '../../hooks/useTheme'
import { useTimer } from '../../hooks/useTimer'
import { formatStopwatch } from '../../utils/date'

function ActiveTimerBanner() {
  const { state, pauseTimer, resumeTimer } = useStudy()
  const navigate = useNavigate()
  const location = useLocation()
  const elapsed = useTimer(state.activeTimer)

  if (!state.activeTimer || location.pathname === '/today') return null

  const item = state.items.find((i) => i.id === state.activeTimer?.itemId)
  const isPaused = state.activeTimer.isPaused

  const togglePause = () => {
    if (isPaused) resumeTimer()
    else pauseTimer()
  }

  return (
    <button
      onClick={() => navigate('/today')}
      className="flex w-full items-center justify-between gap-3 bg-indigo-600 px-4 py-2.5 text-left text-white sm:px-6"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <TimerIcon size={16} className="shrink-0" />
        <span className="truncate text-sm font-medium">{item?.title ?? 'Study session'} in progress</span>
        <span className="shrink-0 font-mono text-sm tabular-nums">{formatStopwatch(elapsed)}</span>
      </div>
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation()
          togglePause()
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.stopPropagation()
            togglePause()
          }
        }}
        className="shrink-0 rounded-full bg-white/20 p-1.5 hover:bg-white/30"
        aria-label={isPaused ? 'Resume timer' : 'Pause timer'}
      >
        {isPaused ? <Play size={14} /> : <Pause size={14} />}
      </span>
    </button>
  )
}

export function Layout() {
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const current = NAV_ITEMS.find((i) => (i.end ? location.pathname === i.to : location.pathname.startsWith(i.to)))

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <ActiveTimerBanner />
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3.5 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{current?.label ?? 'StudyFlow'}</h1>
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>
        <main className="flex-1 px-4 pb-20 pt-4 sm:px-6 sm:pb-6 md:pb-6">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
