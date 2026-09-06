import { useState } from 'react'
import type { StudyItem } from '../../types'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'
import { BookOpen } from 'lucide-react'

interface ReviewItemPickerModalProps {
  open: boolean
  onClose: () => void
  onSave: (studyItemIds: string[]) => void
  items: StudyItem[]
  initialSelectedIds: string[]
}

export function ReviewItemPickerModal({ open, onClose, onSave, items, initialSelectedIds }: ReviewItemPickerModalProps) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initialSelectedIds))

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Link review material"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSave(Array.from(selected))
              onClose()
            }}
          >
            Save
          </Button>
        </>
      }
    >
      {items.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={32} />}
          title="No study content yet"
          description="Add study items to this goal first, then link them here as review material for this exam."
        />
      ) : (
        <div className="space-y-1.5">
          {items.map((item) => (
            <label
              key={item.id}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-2.5 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/60"
            >
              <input
                type="checkbox"
                checked={selected.has(item.id)}
                onChange={() => toggle(item.id)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{item.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {item.course} · {item.topic}
                </p>
              </div>
              {item.completed && <span className="shrink-0 text-xs font-medium text-emerald-600 dark:text-emerald-400">Done</span>}
            </label>
          ))}
        </div>
      )}
    </Modal>
  )
}
