import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { StudyNote, StudyNoteInput, StudyNoteType } from '../../types'
import { Button } from '../ui/Button'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { NoteTypePicker } from './NoteTypePicker'
import { NoteForm } from './NoteForm'
import { NoteCard } from './NoteCard'
import { CodeSourcePicker, type CodeSource } from './CodeSourcePicker'
import { ProjectFolderUpload } from './ProjectFolderUpload'

interface NotesListProps {
  goalId: string
  itemId: string
  notes: StudyNote[]
  isLoading: boolean
  error: string | null
  onAdd: (input: StudyNoteInput) => Promise<unknown>
  onUpdate: (id: string, patch: Partial<StudyNoteInput>) => Promise<unknown>
  onDelete: (id: string) => Promise<unknown>
  /** Called after a project-folder upload completes, since that note is created via a separate API call and won't be in `notes` until refetched. */
  onProjectUploaded: () => void
  emptyMessage?: string
}

type AddStep = 'closed' | 'picking' | 'code-source' | 'form' | 'project-upload' | 'saved'

export function NotesList({ goalId, itemId, notes, isLoading, error, onAdd, onUpdate, onDelete, onProjectUploaded, emptyMessage }: NotesListProps) {
  const [addStep, setAddStep] = useState<AddStep>('closed')
  const [addType, setAddType] = useState<StudyNoteType | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingNote, setDeletingNote] = useState<StudyNote | null>(null)

  const startAdd = () => {
    setAddType(null)
    setAddStep('picking')
  }

  const handleSelectType = (type: StudyNoteType) => {
    setAddType(type)
    setAddStep(type === 'code' ? 'code-source' : 'form')
  }

  const handleSelectCodeSource = (source: CodeSource) => {
    setAddStep(source === 'snippet' ? 'form' : 'project-upload')
  }

  const handleSave = async (input: StudyNoteInput) => {
    setSaving(true)
    try {
      await onAdd(input)
      setAddStep('saved')
    } finally {
      setSaving(false)
    }
  }

  const handleProjectUploaded = () => {
    onProjectUploaded()
    setAddStep('saved')
  }

  if (isLoading) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Loading notes...</p>
  }
  if (error) {
    return <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Notes ({notes.length})</p>
        {addStep === 'closed' && (
          <Button size="sm" variant="secondary" icon={<Plus size={14} />} onClick={startAdd}>
            Add Note
          </Button>
        )}
      </div>

      {addStep === 'picking' && (
        <div className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-700">
          <NoteTypePicker onSelect={handleSelectType} />
          <div className="mt-3 flex justify-end">
            <Button variant="secondary" size="sm" onClick={() => setAddStep('closed')}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {addStep === 'code-source' && (
        <div className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-700">
          <CodeSourcePicker onSelect={handleSelectCodeSource} />
          <div className="mt-3 flex justify-end">
            <Button variant="secondary" size="sm" onClick={() => setAddStep('closed')}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {addStep === 'form' && addType && (
        <div className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-700">
          <NoteForm type={addType} onSave={handleSave} onCancel={() => setAddStep('closed')} saving={saving} submitLabel="Save note" />
        </div>
      )}

      {addStep === 'project-upload' && (
        <div className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-700">
          <ProjectFolderUpload goalId={goalId} studyItemId={itemId} onUploaded={handleProjectUploaded} onCancel={() => setAddStep('closed')} />
        </div>
      )}

      {addStep === 'saved' && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400">
          Saved
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setAddStep('closed')}>
              Done
            </Button>
            <Button size="sm" icon={<Plus size={14} />} onClick={startAdd}>
              Add Another Note
            </Button>
          </div>
        </div>
      )}

      {notes.length === 0 && addStep === 'closed' ? (
        <p className="py-2 text-sm text-slate-400 dark:text-slate-500">{emptyMessage ?? 'No notes yet.'}</p>
      ) : (
        <div className="space-y-2.5">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} onUpdate={onUpdate} onDelete={setDeletingNote} />
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
          if (deletingNote) onDelete(deletingNote.id)
          setDeletingNote(null)
        }}
        onCancel={() => setDeletingNote(null)}
      />
    </div>
  )
}
