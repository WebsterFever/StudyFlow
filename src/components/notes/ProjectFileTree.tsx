import { useState } from 'react'
import { ChevronDown, ChevronRight, File, FileCode2, FileJson, FileText, Folder, FolderOpen } from 'lucide-react'
import type { ProjectTreeNode } from '../../utils/projectFiles'

function iconForFile(name: string) {
  const ext = name.split('.').pop()?.toLowerCase()
  if (ext === 'json' || ext === 'jsonc') return FileJson
  if (ext && ['ts', 'tsx', 'js', 'jsx', 'py', 'java', 'cs', 'go', 'rb', 'php', 'c', 'cpp', 'rs'].includes(ext)) return FileCode2
  if (ext === 'md' || ext === 'mdx' || ext === 'txt') return FileText
  return File
}

interface ProjectFileTreeProps {
  nodes: ProjectTreeNode[]
  selectedFileId: string | null
  onSelectFile: (fileId: string, path: string) => void
  /** Paths that matched an active filename search — everything else is dimmed, not hidden, to preserve tree context. */
  matchedPaths?: Set<string> | null
}

export function ProjectFileTree({ nodes, selectedFileId, onSelectFile, matchedPaths }: ProjectFileTreeProps) {
  return (
    <div className="min-w-max text-sm">
      {nodes.map((node) => (
        <TreeNode key={node.path} node={node} depth={0} selectedFileId={selectedFileId} onSelectFile={onSelectFile} matchedPaths={matchedPaths} />
      ))}
    </div>
  )
}

function TreeNode({
  node,
  depth,
  selectedFileId,
  onSelectFile,
  matchedPaths,
}: {
  node: ProjectTreeNode
  depth: number
  selectedFileId: string | null
  onSelectFile: (fileId: string, path: string) => void
  matchedPaths?: Set<string> | null
}) {
  const [expanded, setExpanded] = useState(true)
  const dimmed = matchedPaths != null && !matchedPaths.has(node.path) && !(node.kind === 'dir' && pathHasMatch(node, matchedPaths))

  if (node.kind === 'dir') {
    return (
      <div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
          style={{ paddingLeft: `${depth * 14 + 6}px` }}
        >
          {expanded ? <ChevronDown size={13} className="shrink-0 text-slate-400" /> : <ChevronRight size={13} className="shrink-0 text-slate-400" />}
          {expanded ? <FolderOpen size={14} className="shrink-0 text-indigo-500" /> : <Folder size={14} className="shrink-0 text-indigo-500" />}
          <span className="truncate text-slate-700 dark:text-slate-300">{node.name}</span>
        </button>
        {expanded && (
          <div>
            {node.children.map((child) => (
              <TreeNode key={child.path} node={child} depth={depth + 1} selectedFileId={selectedFileId} onSelectFile={onSelectFile} matchedPaths={matchedPaths} />
            ))}
          </div>
        )}
      </div>
    )
  }

  const Icon = iconForFile(node.name)
  const isActive = node.fileId === selectedFileId
  return (
    <button
      onClick={() => onSelectFile(node.fileId, node.path)}
      className={`flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left ${
        isActive ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
      } ${dimmed ? 'opacity-40' : ''}`}
      style={{ paddingLeft: `${depth * 14 + 24}px` }}
    >
      <Icon size={14} className="shrink-0 text-slate-400" />
      <span className="truncate text-slate-700 dark:text-slate-300">{node.name}</span>
    </button>
  )
}

function pathHasMatch(dir: Extract<ProjectTreeNode, { kind: 'dir' }>, matchedPaths: Set<string>): boolean {
  return dir.children.some((child) => (child.kind === 'file' ? matchedPaths.has(child.path) : pathHasMatch(child, matchedPaths)))
}
