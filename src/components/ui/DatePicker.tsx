import { useEffect, useRef, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react'

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  id?: string
  label?: string
}

const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function parseDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null
}

function toISODate(date: Date): string {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}

function displayDate(value: string): string {
  const date = parseDate(value)
  return date ? [String(date.getDate()).padStart(2, '0'), String(date.getMonth() + 1).padStart(2, '0'), date.getFullYear()].join('/') : ''
}

export function DatePicker({ value, onChange, id, label = 'Select date' }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState(() => {
    const selected = parseDate(value) ?? new Date()
    return new Date(selected.getFullYear(), selected.getMonth(), 1)
  })
  const container = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        trigger.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const selected = parseDate(value)
  const firstWeekday = view.getDay()
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate()
  const today = toISODate(new Date())

  const navigateMonth = (delta: number) => {
    setView((previous) => new Date(previous.getFullYear(), previous.getMonth() + delta, 1))
  }

  const toggle = () => {
    if (!open) {
      const startingDate = parseDate(value) ?? new Date()
      setView(new Date(startingDate.getFullYear(), startingDate.getMonth(), 1))
    }
    setOpen(!open)
  }

  return (
    <div ref={container} className="relative">
      <button
        ref={trigger}
        id={id}
        type="button"
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={toggle}
        className="flex w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-sm text-slate-900 transition-colors hover:border-indigo-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
      >
        <span className={value ? '' : 'text-slate-400 dark:text-slate-500'}>{displayDate(value) || 'dd/mm/yyyy'}</span>
        <CalendarDays size={18} className="shrink-0 text-slate-500" aria-hidden="true" />
      </button>
      {open && (
        <div
          role="dialog"
          aria-label={label}
          className="absolute left-0 top-full z-30 mt-1 w-[min(19rem,calc(100vw-3rem))] rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="mb-3 flex items-center justify-between">
            <button type="button" onClick={() => navigateMonth(-1)} aria-label="Previous month" className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {view.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
            </span>
            <button type="button" onClick={() => navigateMonth(1)} aria-label="Next month" className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500 dark:text-slate-400">
            {weekdays.map((day) => <span key={day} className="py-1">{day}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstWeekday }, (_, index) => <span key={`empty-${index}`} />)}
            {Array.from({ length: daysInMonth }, (_, index) => {
              const day = index + 1
              const date = toISODate(new Date(view.getFullYear(), view.getMonth(), day))
              const isSelected = date === value
              const isToday = date === today
              return (
                <button
                  key={day}
                  type="button"
                  aria-label={new Date(view.getFullYear(), view.getMonth(), day).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  aria-pressed={isSelected}
                  onClick={() => { onChange(date); setOpen(false); trigger.current?.focus() }}
                  className={`flex aspect-square items-center justify-center rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isSelected ? 'bg-indigo-600 font-semibold text-white' : isToday ? 'border border-indigo-500 text-indigo-700 dark:text-indigo-300' : 'text-slate-700 hover:bg-indigo-50 dark:text-slate-200 dark:hover:bg-slate-800'}`}
                >
                  {day}
                </button>
              )
            })}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-2 dark:border-slate-700">
            <button type="button" onClick={() => { onChange(''); setOpen(false); trigger.current?.focus() }} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
              <X size={13} /> Clear
            </button>
            <button type="button" onClick={() => { onChange(today); setOpen(false); trigger.current?.focus() }} className="rounded-md px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-slate-800">
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
