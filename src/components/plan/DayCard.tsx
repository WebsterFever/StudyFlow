import { useState } from 'react'
import { Ban, CalendarCheck } from 'lucide-react'
import type { StudyItem, StudySession } from '../../types'
import { PlanSessionRow } from './PlanSessionRow'
import { formatFriendlyDate, formatMinutes, todayISO } from '../../utils/date'

interface DayCardProps {
  date: string
  sessions: StudySession[]
  itemsById: Map<string, StudyItem>
  availableMinutes: number
  isUnavailable: boolean
  hasOverride: boolean
  moveOptions: { date: string; label: string }[]
  onToggleUnavailable: () => void
  onMoveSession: (sessionId: string, date: string) => void
  onDurationChange: (sessionId: string, minutes: number) => void
  onReorder: (date: string, orderedIds: string[]) => void
}

export function DayCard({
  date,
  sessions,
  itemsById,
  availableMinutes,
  isUnavailable,
  hasOverride,
  moveOptions,
  onToggleUnavailable,
  onMoveSession,
  onDurationChange,
  onReorder,
}: DayCardProps) {
  const [collapsed, setCollapsed] = useState(false)
  const plannedMinutes = sessions.reduce((sum, s) => sum + s.plannedMinutes, 0)
  const isToday = date === todayISO()
  const isOverloaded = !isUnavailable && plannedMinutes > availableMinutes && availableMinutes > 0

  const move = (index: number, dir: -1 | 1) => {
    const ids = sessions.map((s) => s.id)
    const target = index + dir
    if (target < 0 || target >= ids.length) return
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    onReorder(date, ids)
  }

  return (
    <div className={`rounded-2xl border bg-white dark:bg-slate-900 ${isToday ? 'border-indigo-300 dark:border-indigo-800' : 'border-slate-200 dark:border-slate-800'}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <button onClick={() => setCollapsed((c) => !c)} className="flex items-center gap-2 text-left">
          {isToday && <CalendarCheck size={15} className="text-indigo-600 dark:text-indigo-400" />}
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatFriendlyDate(date, { withWeekday: true })}</span>
          {isToday && <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">Today</span>}
        </button>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${isOverloaded ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>
            {isUnavailable ? 'Unavailable' : `${formatMinutes(plannedMinutes)} / ${formatMinutes(availableMinutes)}`}
          </span>
          <button
            onClick={onToggleUnavailable}
            className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-colors ${
              isUnavailable
                ? 'bg-slate-800 text-white dark:bg-slate-700'
                : hasOverride
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
            }`}
          >
            <Ban size={12} />
            {isUnavailable ? 'Unavailable' : 'Mark unavailable'}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="space-y-2 p-3">
          {sessions.length === 0 ? (
            <p className="px-2 py-3 text-center text-xs text-slate-400">No sessions planned</p>
          ) : (
            sessions.map((session, idx) => (
              <PlanSessionRow
                key={session.id}
                session={session}
                item={itemsById.get(session.itemId)}
                moveOptions={moveOptions.filter((o) => o.date !== date)}
                onMove={(target) => onMoveSession(session.id, target)}
                onDurationChange={(minutes) => onDurationChange(session.id, minutes)}
                onMoveUp={idx > 0 ? () => move(idx, -1) : undefined}
                onMoveDown={idx < sessions.length - 1 ? () => move(idx, 1) : undefined}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
