import type { ReactNode } from 'react'

type Tone = 'slate' | 'green' | 'amber' | 'red' | 'indigo' | 'blue' | 'purple'

const TONE_CLASSES: Record<Tone, string> = {
  slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
}

export function Badge({ tone = 'slate', children, className = '' }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]} ${className}`}>
      {children}
    </span>
  )
}

export function priorityTone(priority: string): Tone {
  if (priority === 'High') return 'red'
  if (priority === 'Medium') return 'amber'
  return 'slate'
}

export function difficultyTone(difficulty: string): Tone {
  if (difficulty === 'Hard') return 'purple'
  if (difficulty === 'Intermediate') return 'blue'
  return 'green'
}

export function typeTone(type: string): Tone {
  switch (type) {
    case 'Video':
      return 'indigo'
    case 'Exercise':
      return 'blue'
    case 'Project':
      return 'purple'
    case 'Reading':
      return 'slate'
    case 'Review':
      return 'amber'
    default:
      return 'slate'
  }
}
