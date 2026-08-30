import type { ReactNode } from 'react'
import { Card } from '../ui/Card'

interface StatCardProps {
  icon: ReactNode
  label: string
  value: ReactNode
  sub?: ReactNode
  tone?: 'indigo' | 'green' | 'amber' | 'red' | 'slate'
}

const TONE_CLASSES: Record<NonNullable<StatCardProps['tone']>, string> = {
  indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400',
  green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',
  red: 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400',
  slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
}

export function StatCard({ icon, label, value, sub, tone = 'indigo' }: StatCardProps) {
  return (
    <Card className="flex items-start gap-3.5">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${TONE_CLASSES[tone]}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-0.5 truncate text-xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{sub}</p>}
      </div>
    </Card>
  )
}
