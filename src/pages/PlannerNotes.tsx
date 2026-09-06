import { useState } from 'react'
import { Link } from 'react-router-dom'
import { NotebookPen, Plus, Trash2 } from 'lucide-react'
import { usePlanner } from '../hooks/usePlanner'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Textarea } from '../components/ui/Form'
import type { PlannerNote } from '../types'

export default function PlannerNotes() {
  const { activeGoal, notes, createNote, updateNote, deleteNote } = usePlanner()
  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [deletingNote, setDeletingNote] = useState<PlannerNote | null>(null)

  if (!activeGoal) {
    return (
      <EmptyState
        icon={<NotebookPen size={40} />}
        title="No planner goal yet"
        description="Create a goal to start taking notes."
        action={
          <Link to="/planner/goals">
            <Button>Create a goal</Button>
          </Link>
        }
      />
    )
  }

  const submit = () => {
    const trimmed = draft.trim()
    if (!trimmed) return
    createNote({ goalId: activeGoal.id, content: trimmed })
    setDraft('')
  }

  const startEdit = (note: PlannerNote) => {
    setEditingId(note.id)
    setEditingContent(note.content)
  }

  const saveEdit = () => {
    if (!editingId) return
    const trimmed = editingContent.trim()
    if (trimmed) updateNote(editingId, { content: trimmed })
    setEditingId(null)
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Notes</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{activeGoal.name}</p>
      </div>

      <Card>
        <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} placeholder="Jot down a note for this goal..." />
        <div className="mt-2 flex justify-end">
          <Button size="sm" icon={<Plus size={14} />} onClick={submit}>
            Add Note
          </Button>
        </div>
      </Card>

      {notes.length === 0 ? (
        <EmptyState icon={<NotebookPen size={40} />} title="No notes yet" description="Add a note above to start your planning notebook for this goal." />
      ) : (
        <div className="space-y-2.5">
          {notes.map((note) => (
            <Card key={note.id} className="p-3.5">
              {editingId === note.id ? (
                <div className="space-y-2">
                  <Textarea value={editingContent} onChange={(e) => setEditingContent(e.target.value)} rows={3} autoFocus />
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={saveEdit}>
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <p onClick={() => startEdit(note)} className="min-w-0 flex-1 cursor-text whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                    {note.content}
                  </p>
                  <button
                    onClick={() => setDeletingNote(note)}
                    aria-label="Delete note"
                    className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deletingNote != null}
        title="Delete note"
        message="Are you sure you want to delete this note? This cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={() => {
          if (deletingNote) deleteNote(deletingNote.id)
          setDeletingNote(null)
        }}
        onCancel={() => setDeletingNote(null)}
      />
    </div>
  )
}
