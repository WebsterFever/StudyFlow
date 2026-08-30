import { useRef, useState } from 'react'
import { AlertCircle, Database, Download, Sparkles, Trash2, Upload } from 'lucide-react'
import { useStudy } from '../hooks/useStudy'
import { GoalForm } from '../components/settings/GoalForm'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { importStudyData } from '../services/storage'

export default function Settings() {
  const { state, setGoal, exportData, importData, resetData, loadDemoData } = useStudy()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmDemo, setConfirmDemo] = useState(false)

  const handleImportClick = () => fileInputRef.current?.click()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const data = await importStudyData(file)
      importData(data)
      setImportError(null)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to import file.')
    }
  }

  return (
    <div className="space-y-5">
      <GoalForm goal={state.goal} onSave={setGoal} />

      <Card>
        <CardHeader title="Demo data" subtitle="Load sample content covering HTML, CSS, JavaScript, TypeScript and React" />
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
          This replaces your current goal and content with a ready-made example so you can try StudyFlow immediately. You can clear it any time
          from Reset All Data below.
        </p>
        <Button variant="secondary" icon={<Sparkles size={16} />} onClick={() => setConfirmDemo(true)}>
          Load demo data
        </Button>
      </Card>

      <Card>
        <CardHeader title="Backup & restore" subtitle="StudyFlow stores everything locally in your browser" />
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={<Download size={16} />} onClick={exportData}>
            Export data
          </Button>
          <Button variant="secondary" icon={<Upload size={16} />} onClick={handleImportClick}>
            Import data
          </Button>
          <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleFileChange} />
        </div>
        {importError && (
          <p className="mt-3 flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
            <AlertCircle size={14} /> {importError}
          </p>
        )}
      </Card>

      <Card className="border-red-200 dark:border-red-900">
        <CardHeader title="Danger zone" subtitle="This cannot be undone" />
        <div className="flex items-center gap-3 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">
          <Database size={16} />
          Reset all data — deletes your goal, content, sessions and history from this device.
        </div>
        <div className="mt-3">
          <Button variant="danger" icon={<Trash2 size={16} />} onClick={() => setConfirmReset(true)}>
            Reset all data
          </Button>
        </div>
      </Card>

      <ConfirmDialog
        open={confirmReset}
        title="Reset all data?"
        message="This will permanently delete your goal, study content, plan and history from this browser. This cannot be undone."
        confirmLabel="Reset everything"
        danger
        onConfirm={() => {
          resetData()
          setConfirmReset(false)
        }}
        onCancel={() => setConfirmReset(false)}
      />

      <ConfirmDialog
        open={confirmDemo}
        title="Load demo data?"
        message="This will replace your current goal and study content with sample data. Any existing plan will be regenerated."
        confirmLabel="Load demo data"
        onConfirm={() => {
          loadDemoData()
          setConfirmDemo(false)
        }}
        onCancel={() => setConfirmDemo(false)}
      />
    </div>
  )
}
