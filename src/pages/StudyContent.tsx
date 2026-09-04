import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, CheckCircle2, Circle, Layers, NotebookPen, Pencil, Plus, Search, Target, Trash2 } from 'lucide-react'
import { useStudy } from '../hooks/useStudy'
import type { StudyItem } from '../types'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Select, Input } from '../components/ui/Form'
import { Badge, difficultyTone, priorityTone, typeTone } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { ContentFormModal } from '../components/content/ContentFormModal'
import { BulkAddModal } from '../components/content/BulkAddModal'
import { ItemNotesModal } from '../components/notes/ItemNotesModal'
import { formatMinutes } from '../utils/date'

type SortKey = 'order' | 'title' | 'duration' | 'priority' | 'difficulty'
type StatusFilter = 'all' | 'completed' | 'incomplete'

const PRIORITY_WEIGHT: Record<string, number> = { High: 0, Medium: 1, Low: 2 }
const DIFFICULTY_WEIGHT: Record<string, number> = { Easy: 0, Intermediate: 1, Hard: 2 }

export default function StudyContent() {
  const { items, activeGoal, addItem, addItems, updateItem, deleteItem, toggleItemComplete } = useStudy()

  const [search, setSearch] = useState('')
  const [course, setCourse] = useState('all')
  const [topic, setTopic] = useState('all')
  const [type, setType] = useState('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [difficulty, setDifficulty] = useState('all')
  const [priority, setPriority] = useState('all')
  const [sortBy, setSortBy] = useState<SortKey>('order')

  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<StudyItem | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState<StudyItem | null>(null)
  const [notesItem, setNotesItem] = useState<StudyItem | null>(null)

  const courses = useMemo(() => Array.from(new Set(items.map((i) => i.course))).sort(), [items])
  const topics = useMemo(
    () => Array.from(new Set(items.filter((i) => course === 'all' || i.course === course).map((i) => i.topic))).sort(),
    [items, course],
  )

  const filtered = useMemo(() => {
    let list = items.filter((item) => {
      if (search.trim() && !item.title.toLowerCase().includes(search.trim().toLowerCase())) return false
      if (course !== 'all' && item.course !== course) return false
      if (topic !== 'all' && item.topic !== topic) return false
      if (type !== 'all' && item.type !== type) return false
      if (status === 'completed' && !item.completed) return false
      if (status === 'incomplete' && item.completed) return false
      if (difficulty !== 'all' && item.difficulty !== difficulty) return false
      if (priority !== 'all' && item.priority !== priority) return false
      return true
    })
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title)
        case 'duration':
          return b.durationMinutes - a.durationMinutes
        case 'priority':
          return PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority]
        case 'difficulty':
          return DIFFICULTY_WEIGHT[a.difficulty] - DIFFICULTY_WEIGHT[b.difficulty]
        default:
          return a.order - b.order
      }
    })
    return list
  }, [items, search, course, topic, type, status, difficulty, priority, sortBy])

  const nextOrder = items.length === 0 ? 0 : Math.max(...items.map((i) => i.order)) + 1

  const openAdd = () => {
    setEditingItem(null)
    setFormOpen(true)
  }
  const openEdit = (item: StudyItem) => {
    setEditingItem(item)
    setFormOpen(true)
  }
  const handleSave = (item: StudyItem) => {
    if (editingItem) updateItem(item)
    else addItem(item)
    setFormOpen(false)
  }

  if (!activeGoal) {
    return (
      <EmptyState
        icon={<Target size={40} />}
        title="No study goal yet"
        description="Create a goal to start adding study content."
        action={
          <Link to="/goals">
            <Button>Create a goal</Button>
          </Link>
        }
      />
    )
  }

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState
          icon={<BookOpen size={40} />}
          title="No study content yet"
          description="Add your first lesson to generate your study plan, or bulk-add everything at once."
          action={
            <div className="flex gap-2">
              <Button variant="secondary" icon={<Layers size={16} />} onClick={() => setBulkOpen(true)}>
                Bulk add
              </Button>
              <Button icon={<Plus size={16} />} onClick={openAdd}>
                Add item
              </Button>
            </div>
          }
        />
        <ContentFormModal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSave={handleSave}
          initial={editingItem}
          existingCourses={courses}
          existingTopics={topics}
          nextOrder={nextOrder}
          goalId={activeGoal.id}
          goalName={activeGoal.name}
        />
        <BulkAddModal open={bulkOpen} onClose={() => setBulkOpen(false)} onAdd={addItems} existingCourses={courses} nextOrder={nextOrder} goalId={activeGoal.id} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search content..." className="pl-9" />
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<Layers size={16} />} onClick={() => setBulkOpen(true)}>
            Bulk add
          </Button>
          <Button icon={<Plus size={16} />} onClick={openAdd}>
            Add item
          </Button>
        </div>
      </div>

      <Card className="p-3 sm:p-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <Select value={course} onChange={(e) => { setCourse(e.target.value); setTopic('all') }}>
            <option value="all">All courses</option>
            {courses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Select value={topic} onChange={(e) => setTopic(e.target.value)}>
            <option value="all">All topics</option>
            {topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="all">All types</option>
            {['Video', 'Exercise', 'Project', 'Reading', 'Review'].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}>
            <option value="all">All status</option>
            <option value="incomplete">Incomplete</option>
            <option value="completed">Completed</option>
          </Select>
          <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="all">All difficulty</option>
            {['Easy', 'Intermediate', 'Hard'].map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
          <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="all">All priority</option>
            {['High', 'Medium', 'Low'].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {filtered.length} of {items.length} items
          </p>
          <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            Sort by
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="rounded-md border border-slate-300 bg-white px-1.5 py-1 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="order">Default</option>
              <option value="title">Title</option>
              <option value="duration">Duration</option>
              <option value="priority">Priority</option>
              <option value="difficulty">Difficulty</option>
            </select>
          </label>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState title="No items match your filters" description="Try adjusting or clearing your filters." />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-2.5 w-8" />
                  <th className="px-3 py-2.5">Title</th>
                  <th className="px-3 py-2.5">Course / Topic</th>
                  <th className="px-3 py-2.5">Type</th>
                  <th className="px-3 py-2.5">Duration</th>
                  <th className="px-3 py-2.5">Difficulty</th>
                  <th className="px-3 py-2.5">Priority</th>
                  <th className="px-3 py-2.5">Mastery</th>
                  <th className="px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => toggleItemComplete(item.id, !item.completed)}
                        aria-label={item.completed ? 'Mark incomplete' : 'Mark complete'}
                        className="text-slate-300 hover:text-emerald-500 dark:text-slate-600"
                      >
                        {item.completed ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Circle size={18} />}
                      </button>
                    </td>
                    <td className={`px-3 py-2.5 font-medium ${item.completed ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-slate-100'}`}>
                      {item.title}
                    </td>
                    <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">
                      {item.course} <span className="text-slate-300 dark:text-slate-600">/</span> {item.topic}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge tone={typeTone(item.type)}>{item.type}</Badge>
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{formatMinutes(item.durationMinutes)}</td>
                    <td className="px-3 py-2.5">
                      <Badge tone={difficultyTone(item.difficulty)}>{item.difficulty}</Badge>
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge tone={priorityTone(item.priority)}>{item.priority}</Badge>
                    </td>
                    <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">{item.mastery ? `${item.mastery}/5` : '—'}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setNotesItem(item)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/40"
                          aria-label="Notes"
                          title="Notes"
                        >
                          <NotebookPen size={15} />
                        </button>
                        <button
                          onClick={() => openEdit(item)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                          aria-label="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeletingItem(item)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40"
                          aria-label="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ContentFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        initial={editingItem}
        existingCourses={courses}
        existingTopics={topics}
        nextOrder={nextOrder}
        goalId={activeGoal.id}
        goalName={activeGoal.name}
      />
      <BulkAddModal open={bulkOpen} onClose={() => setBulkOpen(false)} onAdd={addItems} existingCourses={courses} nextOrder={nextOrder} goalId={activeGoal.id} />
      {notesItem && (
        <ItemNotesModal goalId={activeGoal.id} itemId={notesItem.id} itemTitle={notesItem.title} onClose={() => setNotesItem(null)} />
      )}
      <ConfirmDialog
        open={deletingItem != null}
        title="Delete study item"
        message={`Are you sure you want to delete "${deletingItem?.title}"? This will also remove its planned study sessions.`}
        confirmLabel="Delete"
        danger
        onConfirm={() => {
          if (deletingItem) deleteItem(deletingItem.id)
          setDeletingItem(null)
        }}
        onCancel={() => setDeletingItem(null)}
      />
    </div>
  )
}
