import { Code2, FolderUp } from 'lucide-react'

export type CodeSource = 'snippet' | 'project'

export function CodeSourcePicker({ onSelect }: { onSelect: (source: CodeSource) => void }) {
  return (
    <div>
      <p className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">Choose code type</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          onClick={() => onSelect('snippet')}
          className="flex flex-col items-start gap-1.5 rounded-xl border border-slate-200 p-3 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-700 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/40"
        >
          <Code2 size={18} className="text-indigo-600 dark:text-indigo-400" />
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Code Snippet</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">Save one piece of code manually.</span>
        </button>
        <button
          onClick={() => onSelect('project')}
          className="flex flex-col items-start gap-1.5 rounded-xl border border-slate-200 p-3 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-700 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/40"
        >
          <FolderUp size={18} className="text-indigo-600 dark:text-indigo-400" />
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Project Folder</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">Upload and browse an entire project folder.</span>
        </button>
      </div>
    </div>
  )
}
