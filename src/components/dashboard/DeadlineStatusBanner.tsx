import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import type { AchievabilitySummary } from '../../utils/calculations'
import { formatMinutes } from '../../utils/date'

export function DeadlineStatusBanner({ achievability }: { achievability: AchievabilitySummary }) {
  if (achievability.status === 'no-goal') return null

  if (achievability.status === 'on-track') {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 dark:border-emerald-900 dark:bg-emerald-950/40">
        <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <div>
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">ON TRACK</p>
          <p className="mt-0.5 text-sm text-emerald-700 dark:text-emerald-400">
            You have enough available time to finish your plan before the deadline.
          </p>
        </div>
      </div>
    )
  }

  const isAtRisk = achievability.status === 'at-risk'
  const extraPerDay = formatMinutes(achievability.extraMinutesPerDayNeeded)

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 ${
        isAtRisk
          ? 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40'
          : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40'
      }`}
    >
      {isAtRisk ? (
        <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
      ) : (
        <XCircle size={20} className="mt-0.5 shrink-0 text-red-600 dark:text-red-400" />
      )}
      <div>
        <p className={`text-sm font-semibold ${isAtRisk ? 'text-amber-800 dark:text-amber-300' : 'text-red-800 dark:text-red-300'}`}>
          {isAtRisk ? 'AT RISK' : 'BEHIND'}
        </p>
        <p className={`mt-0.5 text-sm ${isAtRisk ? 'text-amber-700 dark:text-amber-400' : 'text-red-700 dark:text-red-400'}`}>
          {isAtRisk
            ? `You need approximately ${extraPerDay} of additional study time per remaining day.`
            : `Your remaining study time exceeds your available time significantly. Your current plan requires ${formatMinutes(achievability.differenceMinutes)} of additional study time before your deadline.`}
        </p>
        <p className={`mt-1 text-xs ${isAtRisk ? 'text-amber-600 dark:text-amber-500' : 'text-red-600 dark:text-red-500'}`}>
          Approximately {extraPerDay} extra per remaining study day is required to stay on schedule.
        </p>
      </div>
    </div>
  )
}
