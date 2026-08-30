import { useEffect, useState } from 'react'
import type { Difficulty, Priority, StudyItem, StudyType } from '../../types'
import { DIFFICULTIES, PRIORITIES, STUDY_TYPES } from '../../types'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Field, Input, Select, Textarea } from '../ui/Form'
import { generateId } from '../../utils/id'

export interface ContentFormValues {
  title: string
  course: string
  topic: string
  type: StudyType
  durationMinutes: string
  difficulty: Difficulty
  priority: Priority
  notes: string
}

const EMPTY_FORM: ContentFormValues = {
  title: '',
  course: '',
  topic: '',
  type: 'Video',
  durationMinutes: '',
  difficulty: 'Intermediate',
  priority: 'Medium',
  notes: '',
}

interface ContentFormModalProps {
  open: boolean
  onClose: () => void
  onSave: (item: StudyItem) => void
  initial?: StudyItem | null
  existingCourses: string[]
  existingTopics: string[]
  nextOrder: number
  goalId: string
  goalName: string
}

export function ContentFormModal({
  open,
  onClose,
  onSave,
  initial,
  existingCourses,
  existingTopics,
  nextOrder,
  goalId,
  goalName,
}: ContentFormModalProps) {
  const [values, setValues] = useState<ContentFormValues>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof ContentFormValues, string>>>({})

  useEffect(() => {
    if (!open) return
    if (initial) {
      setValues({
        title: initial.title,
        course: initial.course,
        topic: initial.topic,
        type: initial.type,
        durationMinutes: String(initial.durationMinutes),
        difficulty: initial.difficulty,
        priority: initial.priority,
        notes: initial.notes,
      })
    } else {
      setValues(EMPTY_FORM)
    }
    setErrors({})
  }, [open, initial])

  const handleSubmit = () => {
    const nextErrors: Partial<Record<keyof ContentFormValues, string>> = {}
    if (!values.title.trim()) nextErrors.title = 'Title cannot be empty.'
    if (!values.course.trim()) nextErrors.course = 'Course is required.'
    if (!values.topic.trim()) nextErrors.topic = 'Topic is required.'
    const minutes = Number(values.durationMinutes)
    if (!Number.isFinite(minutes) || minutes <= 0) nextErrors.durationMinutes = 'Duration must be greater than zero.'

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    const now = new Date().toISOString()
    const trimmed = {
      title: values.title.trim(),
      course: values.course.trim(),
      topic: values.topic.trim(),
      notes: values.notes.trim(),
    }
    const item: StudyItem = initial
      ? { ...initial, ...trimmed, type: values.type, durationMinutes: Math.round(minutes), difficulty: values.difficulty, priority: values.priority }
      : {
          id: generateId('item'),
          goalId,
          ...trimmed,
          type: values.type,
          durationMinutes: Math.round(minutes),
          difficulty: values.difficulty,
          priority: values.priority,
          completed: false,
          completedDate: null,
          mastery: null,
          createdDate: now,
          order: nextOrder,
        }
    onSave(item)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit study item' : 'Add study item'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>{initial ? 'Save changes' : 'Add item'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        {!initial && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Adding content to <span className="font-medium text-slate-700 dark:text-slate-300">{goalName}</span>
          </p>
        )}
        <Field label="Title" required error={errors.title}>
          <Input
            value={values.title}
            onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
            placeholder="e.g. React useEffect Deep Dive"
            error={!!errors.title}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Course" required error={errors.course}>
            <Input
              list="course-options"
              value={values.course}
              onChange={(e) => setValues((v) => ({ ...v, course: e.target.value }))}
              placeholder="Frontend"
              error={!!errors.course}
            />
            <datalist id="course-options">
              {existingCourses.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label="Topic" required error={errors.topic}>
            <Input
              list="topic-options"
              value={values.topic}
              onChange={(e) => setValues((v) => ({ ...v, topic: e.target.value }))}
              placeholder="React Hooks"
              error={!!errors.topic}
            />
            <datalist id="topic-options">
              {existingTopics.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Type" required>
            <Select value={values.type} onChange={(e) => setValues((v) => ({ ...v, type: e.target.value as StudyType }))}>
              {STUDY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Duration (minutes)" required error={errors.durationMinutes}>
            <Input
              type="number"
              min={1}
              value={values.durationMinutes}
              onChange={(e) => setValues((v) => ({ ...v, durationMinutes: e.target.value }))}
              placeholder="90"
              error={!!errors.durationMinutes}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Difficulty">
            <Select value={values.difficulty} onChange={(e) => setValues((v) => ({ ...v, difficulty: e.target.value as Difficulty }))}>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Priority">
            <Select value={values.priority} onChange={(e) => setValues((v) => ({ ...v, priority: e.target.value as Priority }))}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Notes">
          <Textarea
            rows={3}
            value={values.notes}
            onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))}
            placeholder="Optional notes..."
          />
        </Field>
      </div>
    </Modal>
  )
}
