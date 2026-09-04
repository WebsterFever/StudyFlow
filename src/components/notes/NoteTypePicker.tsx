import { AlertTriangle, Code2, FileText, HelpCircle, Link2, Terminal } from 'lucide-react'
import type { StudyNoteType } from '../../types'

interface NoteTypeOption {
  type: StudyNoteType
  label: string
  description: string
  icon: typeof FileText
}

const OPTIONS: NoteTypeOption[] = [
  { type: 'text', label: 'Text', description: 'An explanation or free-form note', icon: FileText },
  { type: 'code', label: 'Code', description: 'A code snippet with syntax highlighting', icon: Code2 },
  { type: 'important', label: 'Important', description: 'Something worth remembering', icon: AlertTriangle },
  { type: 'question', label: 'Question', description: "Something you don't understand yet", icon: HelpCircle },
  { type: 'command', label: 'Command', description: 'Terminal / CLI commands', icon: Terminal },
  { type: 'resource', label: 'Resource', description: 'A link worth revisiting', icon: Link2 },
]

export function NoteTypePicker({ onSelect }: { onSelect: (type: StudyNoteType) => void }) {
  return (
    <div>
      <p className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">What type of note do you want to add?</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {OPTIONS.map(({ type, label, description, icon: Icon }) => (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className="flex flex-col items-start gap-1.5 rounded-xl border border-slate-200 p-3 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-700 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/40"
          >
            <Icon size={18} className="text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{description}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
