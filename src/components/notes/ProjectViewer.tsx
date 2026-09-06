import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Search } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Form'
import { CodeBlock } from './CodeBlock'
import { ProjectFileTree } from './ProjectFileTree'
import * as projectSnapshotsApi from '../../services/projectSnapshotsApi'
import { buildProjectTree, formatBytes } from '../../utils/projectFiles'
import { prismLangForExtension } from '../../utils/codeLanguages'
import type { ProjectFileMeta, ProjectSnapshotSummary } from '../../types'

interface ProjectViewerProps {
  snapshotId: string
  onClose: () => void
}

export function ProjectViewer({ snapshotId, onClose }: ProjectViewerProps) {
  const [snapshot, setSnapshot] = useState<ProjectSnapshotSummary | null>(null)
  const [files, setFiles] = useState<ProjectFileMeta[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [mobileView, setMobileView] = useState<'tree' | 'file'>('tree')

  useEffect(() => {
    projectSnapshotsApi
      .fetchProjectSnapshot(snapshotId)
      .then(({ snapshot, files }) => {
        setSnapshot(snapshot)
        setFiles(files)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load project.'))
      .finally(() => setIsLoading(false))
  }, [snapshotId])

  const tree = useMemo(() => buildProjectTree(files.map((f) => ({ id: f.id, path: f.path }))), [files])
  const selectedFile = files.find((f) => f.id === selectedFileId) ?? null

  const matchedPaths = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return null
    const matches = new Set<string>()
    for (const file of files) {
      if (file.path.toLowerCase().includes(q) || (file.content && file.content.toLowerCase().includes(q))) {
        matches.add(file.path)
      }
    }
    return matches
  }, [files, search])

  const handleSelectFile = (fileId: string) => {
    setSelectedFileId(fileId)
    setMobileView('file')
  }

  return (
    <Modal open onClose={onClose} title={snapshot?.name ?? 'Project'} size="xl">
      {isLoading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading project...</p>
      ) : error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : (
        <div className="flex h-[65vh] flex-col">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {snapshot?.fileCount} files · {snapshot ? formatBytes(snapshot.totalSize) : ''}
            </p>
            <div className="relative w-48">
              <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search files..." className="py-1.5 pl-7 text-xs" />
            </div>
          </div>

          <div className="flex min-h-0 flex-1 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
            <div className={`${mobileView === 'tree' ? 'block' : 'hidden'} w-full overflow-auto border-slate-200 p-1.5 dark:border-slate-700 sm:block sm:w-64 sm:shrink-0 sm:border-r`}>
              <ProjectFileTree nodes={tree} selectedFileId={selectedFileId} onSelectFile={handleSelectFile} matchedPaths={matchedPaths} />
            </div>

            <div className={`${mobileView === 'file' ? 'flex' : 'hidden'} min-w-0 flex-1 flex-col sm:flex`}>
              {selectedFile ? (
                <>
                  <div className="flex items-center gap-2 border-b border-slate-200 px-2 py-1.5 dark:border-slate-700">
                    <button onClick={() => setMobileView('tree')} className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 sm:hidden">
                      <ArrowLeft size={15} />
                    </button>
                    <span className="truncate font-mono text-xs text-slate-600 dark:text-slate-300">{selectedFile.path}</span>
                  </div>
                  <div className="min-h-0 flex-1 overflow-auto p-2">
                    {selectedFile.content != null ? (
                      <CodeBlock code={selectedFile.content} prismLang={prismLangForExtension(selectedFile.extension)} />
                    ) : (
                      <p className="p-3 text-sm text-slate-500 dark:text-slate-400">
                        Preview not available for this file type. ({formatBytes(selectedFile.size)})
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center p-6 text-sm text-slate-400 dark:text-slate-500">
                  Select a file to view its contents.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
