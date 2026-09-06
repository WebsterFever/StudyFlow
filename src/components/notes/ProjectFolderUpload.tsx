import { useRef, useState } from 'react'
import type { ChangeEvent, InputHTMLAttributes } from 'react'
import { AlertTriangle, FolderUp } from 'lucide-react'
import { Field, Input } from '../ui/Form'
import { Button } from '../ui/Button'
import * as projectSnapshotsApi from '../../services/projectSnapshotsApi'
import type { ProjectFileUploadInput } from '../../services/projectSnapshotsApi'
import { MAX_FILE_COUNT, MAX_FILE_SIZE_BYTES, MAX_TOTAL_SIZE_BYTES, formatBytes, isDisplayableAsText, isPathExcluded } from '../../utils/projectFiles'
import type { StudyNote } from '../../types'

// webkitdirectory/directory aren't in React's InputHTMLAttributes typings.
type DirectoryInputProps = InputHTMLAttributes<HTMLInputElement> & { webkitdirectory?: string; directory?: string }

interface ScannedState {
  files: ProjectFileUploadInput[]
  excludedCount: number
  oversizedCount: number
}

type Step = 'pick' | 'scanning' | 'ready' | 'uploading' | 'error'

interface ProjectFolderUploadProps {
  goalId: string
  studyItemId: string
  onUploaded: (note: StudyNote) => void
  onCancel: () => void
}

/** Strips the top-level folder name webkitdirectory includes in every relative path, since it's a local, machine-specific name. */
function stripRootSegment(relativePath: string): string {
  const idx = relativePath.indexOf('/')
  return idx === -1 ? relativePath : relativePath.slice(idx + 1)
}

export function ProjectFolderUpload({ goalId, studyItemId, onUploaded, onCancel }: ProjectFolderUploadProps) {
  const [step, setStep] = useState<Step>('pick')
  const [name, setName] = useState('')
  const [scanned, setScanned] = useState<ScannedState | null>(null)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFolderSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList || fileList.length === 0) return
    setStep('scanning')
    setError(null)

    let excludedCount = 0
    let oversizedCount = 0
    const accepted: ProjectFileUploadInput[] = []

    for (const file of Array.from(fileList)) {
      const relPath = stripRootSegment((file as File & { webkitRelativePath: string }).webkitRelativePath || file.name)
      if (!relPath || isPathExcluded(relPath)) {
        excludedCount++
        continue
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        oversizedCount++
        continue
      }
      const content = isDisplayableAsText(file.name) ? await file.text() : null
      accepted.push({ path: relPath, content, size: file.size })
    }

    if (accepted.length === 0) {
      setError('No files left to upload after excluding node_modules, .git, .env, and similar.')
      setStep('error')
      return
    }
    if (accepted.length > MAX_FILE_COUNT) {
      setError(`This folder has ${accepted.length} files, which exceeds the ${MAX_FILE_COUNT}-file limit. Pick a smaller folder.`)
      setStep('error')
      return
    }
    const totalSize = accepted.reduce((sum, f) => sum + f.size, 0)
    if (totalSize > MAX_TOTAL_SIZE_BYTES) {
      setError(
        `This folder totals ${formatBytes(totalSize)}, which exceeds the ${formatBytes(MAX_TOTAL_SIZE_BYTES)} limit. Pick a smaller folder.`,
      )
      setStep('error')
      return
    }

    setScanned({ files: accepted, excludedCount, oversizedCount })
    setStep('ready')
  }

  const handleUpload = async () => {
    if (!scanned || !name.trim()) return
    setStep('uploading')
    setProgress(0)
    setError(null)
    try {
      const { note } = await projectSnapshotsApi.createProjectSnapshot(
        { goalId, studyItemId, name: name.trim(), files: scanned.files },
        setProgress,
      )
      onUploaded(note)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.')
      setStep('error')
    }
  }

  const directoryProps: DirectoryInputProps = { webkitdirectory: '', directory: '' }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        node_modules, .git, dist, build, .next, coverage, and env/secret files are automatically excluded. Never upload real secrets even in
        other files.
      </p>

      {(step === 'pick' || step === 'scanning') && (
        <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-700">
          <FolderUp size={28} className="mx-auto mb-2 text-slate-400" />
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFolderSelected}
            {...directoryProps}
          />
          <Button variant="secondary" onClick={() => inputRef.current?.click()} disabled={step === 'scanning'}>
            {step === 'scanning' ? 'Scanning...' : 'Choose Folder'}
          </Button>
        </div>
      )}

      {step === 'ready' && scanned && (
        <div className="space-y-3">
          <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-900/60 dark:text-slate-300">
            <p>
              <strong>{scanned.files.length}</strong> files ready ({formatBytes(scanned.files.reduce((s, f) => s + f.size, 0))})
              {scanned.excludedCount > 0 && `, ${scanned.excludedCount} excluded`}
              {scanned.oversizedCount > 0 && `, ${scanned.oversizedCount} skipped for being too large`}.
            </p>
          </div>
          <Field label="Snapshot name" required hint='e.g. "Authentication Added"'>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Initial Setup" autoFocus />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!name.trim()}>
              Upload Project
            </Button>
          </div>
        </div>
      )}

      {step === 'uploading' && (
        <div className="space-y-2">
          <p className="text-sm text-slate-600 dark:text-slate-300">Uploading project... {progress}%</p>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div className="h-full bg-indigo-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {step === 'error' && (
        <div className="space-y-3">
          <p className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
            <AlertTriangle size={14} /> {error}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setStep('pick')
                setScanned(null)
                setError(null)
              }}
            >
              Try Again
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
