import { BookOpen, Pencil, Trash2 } from 'lucide-react'
import type { Exam } from '../../types'
import { Badge } from '../ui/Badge'
import { DropdownMenu } from '../ui/DropdownMenu'
import { ProgressBar } from '../ui/ProgressBar'
import { formatFriendlyDate, isBefore, todayISO } from '../../utils/date'

export function ExamRow({
  exam,
  onEdit,
  onDelete,
  onLinkReviewItems,
}: {
  exam: Exam
  onEdit: () => void
  onDelete: () => void
  onLinkReviewItems: () => void
}) {
  const overdue = isBefore(exam.examDate, todayISO())

  return (
    <div className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-700">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{exam.title}</p>
            {overdue && <Badge tone="red">Past</Badge>}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{formatFriendlyDate(exam.examDate, { withYear: true })}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={onLinkReviewItems}
            aria-label="Link review material"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-400"
          >
            <BookOpen size={18} />
          </button>
          <DropdownMenu
            items={[
              { label: 'Edit', icon: <Pencil size={14} />, onClick: onEdit },
              { label: 'Delete', icon: <Trash2 size={14} />, onClick: onDelete, danger: true },
            ]}
          />
        </div>
      </div>

      <div className="mt-3">
        <ProgressBar
          percent={exam.progressPercent}
          showPercent
          label={exam.reviewItemIds.length === 0 ? 'No review material linked' : `${exam.reviewItemIds.length} item${exam.reviewItemIds.length === 1 ? '' : 's'} linked`}
          tone={exam.progressPercent >= 100 ? 'green' : 'indigo'}
        />
      </div>
    </div>
  )
}
