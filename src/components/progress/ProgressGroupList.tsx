import type { ProgressGroup } from '../../utils/calculations'
import { ProgressBar } from '../ui/ProgressBar'

function toneFor(percent: number): 'green' | 'indigo' | 'amber' {
  if (percent >= 90) return 'green'
  if (percent >= 40) return 'indigo'
  return 'amber'
}

export function ProgressGroupList({ groups }: { groups: ProgressGroup[] }) {
  if (groups.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">No data yet.</p>
  }
  return (
    <div className="space-y-3.5">
      {groups.map((g) => (
        <div key={g.label}>
          <ProgressBar percent={g.percent} tone={toneFor(g.percent)} label={g.label} showPercent size="sm" />
          <p className="mt-1 text-xs text-slate-400">
            {g.completed} / {g.total} completed
          </p>
        </div>
      ))}
    </div>
  )
}
