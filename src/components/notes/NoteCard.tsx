import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Check, Copy, ExternalLink, FolderOpen, HelpCircle, Pencil, Trash2 } from 'lucide-react'
import type { StudyNote, StudyNoteInput } from '../../types'
import { STUDY_NOTE_TYPE_LABELS } from '../../types'
import { Badge, type Tone } from '../ui/Badge'
import { Textarea, Input, Select } from '../ui/Form'
import { Button } from '../ui/Button'
import { CodeBlock } from './CodeBlock'
import { ProjectViewer } from './ProjectViewer'
import { CODE_LANGUAGE_OPTIONS, codeLanguageLabel } from '../../utils/codeLanguages'

const TYPE_TONE: Record<StudyNote['type'], Tone> = {
  text: 'slate',
  code: 'indigo',
  important: 'amber',
  question: 'purple',
  command: 'blue',
  resource: 'green',
  project: 'purple',
}

const AUTOSAVE_DELAY_MS = 1000

interface NoteCardProps {
  note: StudyNote
  onUpdate: (id: string, patch: Partial<StudyNoteInput>) => Promise<unknown>
  onDelete: (note: StudyNote) => void
}

export function NoteCard({ note, onUpdate, onDelete }: NoteCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [projectViewerOpen, setProjectViewerOpen] = useState(false)

  const [title, setTitle] = useState(note.title ?? '')
  const [content, setContent] = useState(note.content ?? '')
  const [fileName, setFileName] = useState(note.fileName ?? '')
  const [codeLanguage, setCodeLanguage] = useState(note.codeLanguage ?? 'javascript')
  const [url, setUrl] = useState(note.url ?? '')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const skipNextSave = useRef(true)

  useEffect(() => {
    if (!isEditing) return
    if (skipNextSave.current) {
      skipNextSave.current = false
      return
    }
    setSaveState('saving')
    const timer = setTimeout(() => {
      onUpdate(note.id, {
        title: title.trim() || undefined,
        content: content || undefined,
        fileName: note.type === 'code' ? fileName.trim() || undefined : undefined,
        codeLanguage: note.type === 'code' ? codeLanguage : undefined,
        url: note.type === 'resource' ? url.trim() || undefined : undefined,
      })
        .then(() => setSaveState('saved'))
        .catch(() => setSaveState('idle'))
    }, AUTOSAVE_DELAY_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, fileName, codeLanguage, url])

  const startEditing = () => {
    skipNextSave.current = true
    setTitle(note.title ?? '')
    setContent(note.content ?? '')
    setFileName(note.fileName ?? '')
    setCodeLanguage(note.codeLanguage ?? 'javascript')
    setUrl(note.url ?? '')
    setSaveState('idle')
    setIsEditing(true)
  }

  const handleCopyCommand = async () => {
    await navigator.clipboard.writeText(note.content ?? '')
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-700">
      <div className="mb-2 flex items-center justify-between gap-2">
        <Badge tone={TYPE_TONE[note.type]}>{STUDY_NOTE_TYPE_LABELS[note.type]}</Badge>
        <div className="flex items-center gap-2">
          {isEditing && (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? 'Saved' : ''}
            </span>
          )}
          {isEditing ? (
            <button
              onClick={() => setIsEditing(false)}
              className="rounded-lg px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
            >
              Done
            </button>
          ) : (
            // Project snapshots are read-only file collections — there's nothing
            // here to edit (renaming isn't wired up), so no Edit button at all.
            note.type !== 'project' && (
              <button
                onClick={startEditing}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                aria-label="Edit note"
              >
                <Pencil size={14} />
              </button>
            )
          )}
          <button
            onClick={() => onDelete(note)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40"
            aria-label="Delete note"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-2.5">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={note.type === 'question' ? 'Question' : note.type === 'resource' ? 'Title' : 'Title (optional)'}
          />
          {note.type === 'code' && (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <Input value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="File name / path" className="font-mono text-xs" />
              <Select value={codeLanguage} onChange={(e) => setCodeLanguage(e.target.value)}>
                {CODE_LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
          )}
          {note.type === 'resource' && <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL" />}
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={note.type === 'code' ? 12 : 5}
            className={note.type === 'code' || note.type === 'command' ? 'font-mono text-xs' : undefined}
            placeholder={note.type === 'question' ? 'Answer / explanation' : note.type === 'resource' ? 'Description' : 'Content'}
          />
        </div>
      ) : (
        <NoteView note={note} copied={copied} onCopyCommand={handleCopyCommand} onOpenProject={() => setProjectViewerOpen(true)} />
      )}

      {projectViewerOpen && note.projectSnapshotId && (
        <ProjectViewer snapshotId={note.projectSnapshotId} onClose={() => setProjectViewerOpen(false)} />
      )}
    </div>
  )
}

function NoteView({
  note,
  copied,
  onCopyCommand,
  onOpenProject,
}: {
  note: StudyNote
  copied: boolean
  onCopyCommand: () => void
  onOpenProject: () => void
}) {
  switch (note.type) {
    case 'project':
      return (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-900/60">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{note.title}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{note.content}</p>
          </div>
          <Button size="sm" variant="secondary" icon={<FolderOpen size={14} />} onClick={onOpenProject}>
            Open Project
          </Button>
        </div>
      )
    case 'code':
      return (
        <div className="space-y-2">
          {note.title && <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{note.title}</p>}
          {(note.fileName || note.codeLanguage) && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              {note.fileName && <span className="font-mono">{note.fileName}</span>}
              {note.codeLanguage && <span className="text-slate-400 dark:text-slate-500">{codeLanguageLabel(note.codeLanguage)}</span>}
            </div>
          )}
          <CodeBlock code={note.content ?? ''} language={note.codeLanguage} />
        </div>
      )
    case 'command':
      return (
        <div className="space-y-2">
          {note.title && <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{note.title}</p>}
          <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-end border-b border-slate-200 bg-slate-50 px-2 py-1 dark:border-slate-700 dark:bg-slate-900/60">
              <button
                onClick={onCopyCommand}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-200 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="overflow-x-auto bg-slate-950 p-3 text-xs leading-relaxed whitespace-pre text-slate-100">{note.content}</pre>
          </div>
        </div>
      )
    case 'important':
      return (
        <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 p-3 dark:border-amber-500 dark:bg-amber-950/30">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
            <AlertTriangle size={13} /> Important
          </div>
          {note.title && <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{note.title}</p>}
          <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{note.content}</p>
        </div>
      )
    case 'question':
      return (
        <div className="space-y-1.5">
          <div className="flex items-start gap-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <HelpCircle size={15} className="mt-0.5 shrink-0 text-purple-500" />
            {note.title}
          </div>
          {note.content ? (
            <p className="whitespace-pre-wrap pl-[22px] text-sm text-slate-600 dark:text-slate-300">{note.content}</p>
          ) : (
            <p className="pl-[22px] text-xs italic text-slate-400 dark:text-slate-500">No answer yet</p>
          )}
        </div>
      )
    case 'resource':
      return (
        <div className="space-y-1">
          <a
            href={note.url ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
          >
            {note.title} <ExternalLink size={13} />
          </a>
          <p className="truncate text-xs text-slate-400 dark:text-slate-500">{note.url}</p>
          {note.content && <p className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{note.content}</p>}
        </div>
      )
    default:
      return (
        <div className="space-y-1">
          {note.title && <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{note.title}</p>}
          <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{note.content}</p>
        </div>
      )
  }
}
