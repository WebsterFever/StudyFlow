import { useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, Plus, Trash2 } from 'lucide-react'
import type { Difficulty, Priority, StudyItem, StudyType } from '../../types'
import { DIFFICULTIES, PRIORITIES, STUDY_TYPES } from '../../types'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Field, Input, Select, Textarea } from '../ui/Form'
import { parseBulkText } from '../../utils/bulkParse'
import { generateId } from '../../utils/id'

interface BulkAddModalProps {
  open: boolean
  onClose: () => void
  onAdd: (items: StudyItem[]) => void
  existingCourses: string[]
  nextOrder: number
  goalId: string
}

const PLACEHOLDER = `React Basics | Video | 120
React Hooks | Video | 95
useEffect Exercise | Exercise | 45
Context API | Video | 130
Context Exercise | Exercise | 60`

interface TableRow {
  id: string
  title: string
  type: StudyType
  minutes: string
}

function newRow(): TableRow {
  return { id: generateId('row'), title: '', type: 'Video', minutes: '' }
}

function buildItem(
  values: { title: string; course: string; topic: string; type: StudyType; minutes: number; difficulty: Difficulty; priority: Priority },
  order: number,
  goalId: string,
): StudyItem {
  return {
    id: generateId('item'),
    goalId,
    title: values.title,
    course: values.course,
    topic: values.topic,
    type: values.type,
    durationMinutes: values.minutes,
    difficulty: values.difficulty,
    priority: values.priority,
    completed: false,
    completedDate: null,
    mastery: null,
    notes: '',
    createdDate: new Date().toISOString(),
    order,
  }
}

export function BulkAddModal({ open, onClose, onAdd, existingCourses, nextOrder, goalId }: BulkAddModalProps) {
  const [mode, setMode] = useState<'paste' | 'table'>('paste')
  const [course, setCourse] = useState(existingCourses[0] ?? '')
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('Intermediate')
  const [priority, setPriority] = useState<Priority>('Medium')
  const [text, setText] = useState('')
  const [rows, setRows] = useState<TableRow[]>([newRow(), newRow(), newRow()])

  const result = useMemo(() => parseBulkText(text, { course, topic, difficulty, priority }), [text, course, topic, difficulty, priority])

  const validTableRows = rows.filter((r) => r.title.trim() !== '' && Number(r.minutes) > 0)

  const resetAll = () => {
    setText('')
    setRows([newRow(), newRow(), newRow()])
  }

  const handleClose = () => {
    resetAll()
    onClose()
  }

  const handleAdd = () => {
    if (mode === 'paste') {
      if (result.rows.length === 0) return
      const items = result.rows.map((row, idx) =>
        buildItem(
          { title: row.title, course: row.course, topic: row.topic, type: row.type, minutes: row.minutes, difficulty: row.difficulty, priority: row.priority },
          nextOrder + idx,
          goalId,
        ),
      )
      onAdd(items)
    } else {
      if (validTableRows.length === 0 || !course.trim()) return
      const items = validTableRows.map((row, idx) =>
        buildItem(
          { title: row.title.trim(), course: course.trim(), topic: topic.trim() || 'General', type: row.type, minutes: Math.round(Number(row.minutes)), difficulty, priority },
          nextOrder + idx,
          goalId,
        ),
      )
      onAdd(items)
    }
    resetAll()
    onClose()
  }

  const addCount = mode === 'paste' ? result.rows.length : validTableRows.length
  const canAdd = mode === 'paste' ? result.rows.length > 0 : validTableRows.length > 0 && course.trim() !== ''

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Bulk add study content"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!canAdd}>
            Add {addCount} item{addCount === 1 ? '' : 's'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
          <button
            onClick={() => setMode('paste')}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${mode === 'paste' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}
          >
            Paste text
          </button>
          <button
            onClick={() => setMode('table')}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${mode === 'table' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}
          >
            Table entry
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Default course" required={mode === 'table'} hint="Used when a line omits it">
            <Input list="bulk-course-options" value={course} onChange={(e) => setCourse(e.target.value)} placeholder="Frontend" />
            <datalist id="bulk-course-options">
              {existingCourses.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label="Default topic" hint="Used when a line omits it">
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="General" />
          </Field>
          <Field label="Difficulty">
            <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Priority">
            <Select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {mode === 'paste' ? (
          <>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Paste one item per line as <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-800">Title | Type | Minutes</code>.
              You can also include topic: <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-800">Title | Topic | Type | Minutes</code>.
            </p>
            <Field label="Items">
              <Textarea rows={10} value={text} onChange={(e) => setText(e.target.value)} placeholder={PLACEHOLDER} className="font-mono text-xs" />
            </Field>

            {text.trim() !== '' && (
              <div className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-900/60">
                <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={14} /> {result.rows.length} valid
                </span>
                {result.errors.length > 0 && (
                  <span className="flex items-center gap-1.5 font-medium text-red-600 dark:text-red-400">
                    <AlertCircle size={14} /> {result.errors.length} error{result.errors.length === 1 ? '' : 's'}
                  </span>
                )}
              </div>
            )}

            {result.errors.length > 0 && (
              <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-2.5 dark:border-red-900 dark:bg-red-950/30">
                {result.errors.map((err) => (
                  <p key={err.line} className="text-xs text-red-700 dark:text-red-400">
                    Line {err.line}: {err.reason}
                  </p>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="space-y-2">
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
              <table className="w-full min-w-[420px] text-sm">
                <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  <tr>
                    <th className="px-3 py-2">Title</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Minutes</th>
                    <th className="px-2 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="px-2 py-1.5">
                        <Input
                          value={row.title}
                          onChange={(e) => setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, title: e.target.value } : r)))}
                          placeholder="Lesson title"
                          className="min-w-[10rem]"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Select
                          value={row.type}
                          onChange={(e) => setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, type: e.target.value as StudyType } : r)))}
                        >
                          {STUDY_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </Select>
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          type="number"
                          min={1}
                          value={row.minutes}
                          onChange={(e) => setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, minutes: e.target.value } : r)))}
                          placeholder="60"
                          className="w-20"
                        />
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <button
                          onClick={() => setRows((rs) => rs.filter((r) => r.id !== row.id))}
                          className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40"
                          aria-label="Remove row"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={() => setRows((rs) => [...rs, newRow()])}>
              Add row
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
