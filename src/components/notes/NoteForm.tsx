import { useState } from 'react'
import { Save } from 'lucide-react'
import type { StudyNote, StudyNoteInput, StudyNoteType } from '../../types'
import { Field, Input, Select, Textarea } from '../ui/Form'
import { Button } from '../ui/Button'
import { CODE_LANGUAGE_OPTIONS } from '../../utils/codeLanguages'

interface NoteFormProps {
  type: StudyNoteType
  initial?: StudyNote | null
  onSave: (input: StudyNoteInput) => void
  onCancel?: () => void
  submitLabel?: string
  saving?: boolean
}

/** Tab inserts two spaces instead of moving focus — matters for code/command notes. */
function handleTabIndent(e: React.KeyboardEvent<HTMLTextAreaElement>) {
  if (e.key !== 'Tab') return
  e.preventDefault()
  const el = e.currentTarget
  const start = el.selectionStart
  const end = el.selectionEnd
  const next = el.value.slice(0, start) + '  ' + el.value.slice(end)
  el.value = next
  el.selectionStart = el.selectionEnd = start + 2
  el.dispatchEvent(new Event('input', { bubbles: true }))
}

export function NoteForm({ type, initial, onSave, onCancel, submitLabel, saving }: NoteFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [content, setContent] = useState(initial?.content ?? '')
  const [fileName, setFileName] = useState(initial?.fileName ?? '')
  const [codeLanguage, setCodeLanguage] = useState(initial?.codeLanguage ?? 'javascript')
  const [url, setUrl] = useState(initial?.url ?? '')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = () => {
    if (type === 'question' && !title.trim()) {
      setError('Enter a question.')
      return
    }
    if (type === 'resource') {
      if (!title.trim()) return setError('Enter a title.')
      if (!url.trim()) return setError('Enter a URL.')
    }
    if (['text', 'important', 'command', 'code'].includes(type) && !content.trim()) {
      setError('This note needs content.')
      return
    }
    setError(null)
    onSave({
      type,
      title: title.trim() || undefined,
      content: content || undefined,
      fileName: type === 'code' ? fileName.trim() || undefined : undefined,
      codeLanguage: type === 'code' ? codeLanguage : undefined,
      url: type === 'resource' ? url.trim() : undefined,
    })
  }

  return (
    <div className="space-y-3">
      {type === 'question' ? (
        <Field label="Question" required>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Why does useEffect run twice in development?" autoFocus />
        </Field>
      ) : type === 'resource' ? (
        <Field label="Title" required>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="React Router Documentation" autoFocus />
        </Field>
      ) : (
        <Field label="Title" hint="Optional">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Understanding useState" autoFocus />
        </Field>
      )}

      {type === 'code' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="File name / path" hint="Optional">
            <Input value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="src/components/Navbar.tsx" className="font-mono text-xs" />
          </Field>
          <Field label="Language">
            <Select value={codeLanguage} onChange={(e) => setCodeLanguage(e.target.value)}>
              {CODE_LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      )}

      {type === 'resource' && (
        <Field label="URL" required>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://reactrouter.com" />
        </Field>
      )}

      <Field
        label={type === 'question' ? 'Answer / Explanation' : type === 'resource' ? 'Description' : type === 'code' ? 'Code' : 'Note'}
        hint={type === 'question' || type === 'resource' ? 'Optional' : undefined}
        error={error ?? undefined}
      >
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={type === 'code' || type === 'command' ? handleTabIndent : undefined}
          rows={type === 'code' ? 12 : type === 'resource' || type === 'question' ? 3 : 6}
          spellCheck={type !== 'code' && type !== 'command'}
          className={type === 'code' || type === 'command' ? 'font-mono text-xs' : undefined}
          placeholder={
            type === 'code'
              ? 'function Navbar() {\n  return <nav>...</nav>\n}'
              : type === 'command'
                ? 'npm install react-router-dom'
                : type === 'important'
                  ? 'Never mutate React state directly.'
                  : type === 'question'
                    ? 'Add the answer here once you find out...'
                    : type === 'resource'
                      ? 'Review nested routes after Aula 7.'
                      : 'useState allows a React component to remember a value between renders.'
          }
        />
      </Field>

      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        )}
        <Button icon={<Save size={16} />} onClick={handleSubmit} disabled={saving}>
          {saving ? 'Saving...' : (submitLabel ?? 'Save note')}
        </Button>
      </div>
    </div>
  )
}
