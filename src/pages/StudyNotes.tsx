import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { NotebookPen, Search, Target } from 'lucide-react'
import { useStudy } from '../hooks/useStudy'
import { useGoalNotes } from '../hooks/useStudyNotes'
import type { StudyNote, StudyNoteType } from '../types'
import { STUDY_NOTE_TYPE_LABELS, STUDY_NOTE_TYPES } from '../types'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Form'
import { EmptyState } from '../components/ui/EmptyState'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { NoteCard } from '../components/notes/NoteCard'

type TypeFilter = 'all' | StudyNoteType

export default function StudyNotes() {
  const { activeGoal, items } = useStudy()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [deletingNote, setDeletingNote] = useState<StudyNote | null>(null)

  const { notes, isLoading, error, editNote, removeNote } = useGoalNotes(activeGoal?.id ?? '')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return notes.filter((note) => {
      if (typeFilter !== 'all' && note.type !== typeFilter) return false
      if (!q) return true
      const haystack = [note.title, note.content, note.fileName, note.url].filter(Boolean).join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }, [notes, search, typeFilter])

  const groups = useMemo(() => {
    const notesByItem = new Map<string, typeof filtered>()
    for (const note of filtered) {
      const list = notesByItem.get(note.studyItemId) ?? []
      list.push(note)
      notesByItem.set(note.studyItemId, list)
    }
    return [...items]
      .sort((a, b) => a.order - b.order)
      .map((item) => ({ item, notes: notesByItem.get(item.id) ?? [] }))
      .filter((group) => group.notes.length > 0)
  }, [items, filtered])

  if (!activeGoal) {
    return (
      <EmptyState
        icon={<Target size={40} />}
        title="No study goal yet"
        description="Create a goal to start taking notes."
        action={
          <Link to="/goals">
            <Button>Create a goal</Button>
          </Link>
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Study Notes</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{activeGoal.name} — your step-by-step project notebook</p>
      </div>

      <Card className="p-3 sm:p-3">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notes..." className="pl-9" />
          </div>
        </div>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <FilterChip label="All" active={typeFilter === 'all'} onClick={() => setTypeFilter('all')} />
          {STUDY_NOTE_TYPES.map((type) => (
            <FilterChip key={type} label={STUDY_NOTE_TYPE_LABELS[type]} active={typeFilter === type} onClick={() => setTypeFilter(type)} />
          ))}
        </div>
      </Card>

      {isLoading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading notes...</p>
      ) : error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={<NotebookPen size={40} />}
          title={notes.length === 0 ? 'No notes yet' : 'No notes match your search'}
          description={
            notes.length === 0
              ? 'Open any lesson in Study Content and click "Add Note" to start building your project notebook.'
              : 'Try a different search term or filter.'
          }
        />
      ) : (
        <div className="space-y-5">
          {groups.map(({ item, notes: itemNotes }) => (
            <Card key={item.id}>
              <CardHeader title={item.title} subtitle={`${item.course} / ${item.topic}`} />
              <div className="space-y-2.5">
                {itemNotes.map((note) => (
                  <NoteCard key={note.id} note={note} onUpdate={editNote} onDelete={setDeletingNote} />
                ))}
              </div>
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
          if (deletingNote) removeNote(deletingNote.id)
          setDeletingNote(null)
        }}
        onCancel={() => setDeletingNote(null)}
      />
    </div>
  )
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? 'bg-indigo-600 text-white'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
      }`}
    >
      {label}
    </button>
  )
}
