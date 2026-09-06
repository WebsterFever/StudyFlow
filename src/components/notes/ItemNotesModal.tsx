import { Modal } from '../ui/Modal'
import { NotesList } from './NotesList'
import { useItemNotes } from '../../hooks/useStudyNotes'
import type { LearningType } from '../../types'

interface ItemNotesModalProps {
  onClose: () => void
  goalId: string
  itemId: string
  itemTitle: string
  learningType: LearningType
}

// The caller must conditionally MOUNT this component (not just toggle an
// `open` prop) — it fetches via useItemNotes on mount, and there's no valid
// item to fetch notes for until one is actually selected.
export function ItemNotesModal({ onClose, goalId, itemId, itemTitle, learningType }: ItemNotesModalProps) {
  const { notes, isLoading, error, addNote, editNote, removeNote, reload } = useItemNotes(goalId, itemId)

  return (
    <Modal open onClose={onClose} title={itemTitle} size="lg">
      <NotesList
        goalId={goalId}
        itemId={itemId}
        learningType={learningType}
        notes={notes}
        isLoading={isLoading}
        error={error}
        onAdd={addNote}
        onUpdate={editNote}
        onDelete={removeNote}
        onProjectUploaded={reload}
        emptyMessage="No notes yet — save explanations, code, commands, or questions while you study this."
      />
    </Modal>
  )
}
