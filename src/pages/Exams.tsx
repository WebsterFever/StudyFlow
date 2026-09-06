import { useState } from 'react'
import { GraduationCap, Plus } from 'lucide-react'
import { useStudy } from '../hooks/useStudy'
import { useGoalExams } from '../hooks/useExams'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { ExamFormModal } from '../components/exams/ExamFormModal'
import { ExamRow } from '../components/exams/ExamRow'
import { ReviewItemPickerModal } from '../components/exams/ReviewItemPickerModal'
import type { Exam, ExamInput } from '../types'

export default function Exams() {
  const { activeGoal, items } = useStudy()
  const goalId = activeGoal?.id ?? ''
  const { exams, isLoading, error, addExam, editExam, setExamReviewItems, removeExam } = useGoalExams(goalId)

  const [formOpen, setFormOpen] = useState(false)
  const [editingExam, setEditingExam] = useState<Exam | null>(null)
  const [deletingExam, setDeletingExam] = useState<Exam | null>(null)
  const [linkingExam, setLinkingExam] = useState<Exam | null>(null)

  if (!activeGoal) {
    return (
      <EmptyState
        icon={<GraduationCap size={40} />}
        title="No active goal"
        description="Create or open a study goal first, then track its exams here."
      />
    )
  }

  const openCreate = () => {
    setEditingExam(null)
    setFormOpen(true)
  }
  const openEdit = (exam: Exam) => {
    setEditingExam(exam)
    setFormOpen(true)
  }

  const handleSave = (values: ExamInput) => {
    if (editingExam) editExam(editingExam.id, values)
    else addExam(values)
  }

  const sorted = [...exams].sort((a, b) => a.examDate.localeCompare(b.examDate))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Exams</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{activeGoal.name}</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={openCreate}>
          New Exam
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading exams...</p>
      ) : error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={<GraduationCap size={40} />}
          title="No exams yet"
          description="Track exam dates and link the study items you need to review."
          action={<Button icon={<Plus size={16} />} onClick={openCreate}>Add your first exam</Button>}
        />
      ) : (
        <div className="space-y-2.5">
          {sorted.map((exam) => (
            <ExamRow
              key={exam.id}
              exam={exam}
              onEdit={() => openEdit(exam)}
              onDelete={() => setDeletingExam(exam)}
              onLinkReviewItems={() => setLinkingExam(exam)}
            />
          ))}
        </div>
      )}

      <ExamFormModal open={formOpen} onClose={() => setFormOpen(false)} onSave={handleSave} goalId={goalId} exam={editingExam} />

      {linkingExam && (
        <ReviewItemPickerModal
          open
          onClose={() => setLinkingExam(null)}
          items={items}
          initialSelectedIds={linkingExam.reviewItemIds}
          onSave={(studyItemIds) => setExamReviewItems(linkingExam.id, studyItemIds)}
        />
      )}

      <ConfirmDialog
        open={deletingExam != null}
        title="Delete exam"
        message={`Are you sure you want to delete "${deletingExam?.title}"?`}
        confirmLabel="Delete"
        danger
        onConfirm={() => {
          if (deletingExam) removeExam(deletingExam.id)
          setDeletingExam(null)
        }}
        onCancel={() => setDeletingExam(null)}
      />
    </div>
  )
}
