import { useState } from 'react'
import type { MasteryRating } from '../../types'
import { MASTERY_LABELS } from '../../types'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

interface MasteryModalProps {
  open: boolean
  itemTitle: string
  onRate: (rating: MasteryRating) => void
  onSkip: () => void
}

const RATINGS: MasteryRating[] = [1, 2, 3, 4, 5]

export function MasteryModal({ open, itemTitle, onRate, onSkip }: MasteryModalProps) {
  const [selected, setSelected] = useState<MasteryRating | null>(null)

  return (
    <Modal
      open={open}
      onClose={onSkip}
      title="How well do you understand this?"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onSkip}>
            Skip
          </Button>
          <Button disabled={selected == null} onClick={() => selected != null && onRate(selected)}>
            Save rating
          </Button>
        </>
      }
    >
      <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
        Nice work finishing <span className="font-medium text-slate-900 dark:text-slate-100">{itemTitle}</span>. Rate your
        mastery so GoalFlow can suggest review sessions.
      </p>
      <div className="space-y-2">
        {RATINGS.map((rating) => (
          <button
            key={rating}
            onClick={() => setSelected(rating)}
            className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
              selected === rating
                ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-950/40'
                : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
            }`}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                selected === rating ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {rating}
            </span>
            <span className="font-medium text-slate-700 dark:text-slate-300">{MASTERY_LABELS[rating]}</span>
          </button>
        ))}
      </div>
    </Modal>
  )
}
