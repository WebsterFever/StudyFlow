// Client-side mirror of backend/src/project-snapshots/project-file-rules.ts.
// This copy only exists to filter before upload (saves bandwidth, gives
// instant feedback) — the backend re-validates everything and is the
// authoritative source of truth, never trusting this alone.

export const MAX_FILE_SIZE_BYTES = 150 * 1024 // 150KB per file
export const MAX_TOTAL_SIZE_BYTES = 15 * 1024 * 1024 // 15MB per project snapshot
export const MAX_FILE_COUNT = 500

const EXCLUDED_DIR_NAMES = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage'])
const EXCLUDED_FILENAMES = new Set(['.env', '.env.local', '.env.production', '.env.development', 'credentials.json'])
const EXCLUDED_FILE_SUFFIXES = ['.pem', '.key']

const TEXT_EXTENSIONS = new Set([
  'ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs',
  'html', 'htm', 'css', 'scss', 'sass', 'less',
  'json', 'jsonc', 'md', 'mdx', 'txt',
  'py', 'java', 'cs', 'sql', 'sh', 'bash', 'zsh',
  'yml', 'yaml', 'xml', 'vue', 'svelte',
  'c', 'cpp', 'cc', 'h', 'hpp', 'go', 'rb', 'php', 'rs', 'kt', 'swift',
  'toml', 'ini', 'gradle', 'gitignore', 'editorconfig', 'env.example',
]) // eslint-disable-line prettier/prettier

const TEXT_FILENAMES = new Set(['dockerfile', 'makefile', 'procfile', 'license'])

export function isPathExcluded(path: string): boolean {
  const segments = path.split('/').filter(Boolean)
  if (segments.some((segment) => EXCLUDED_DIR_NAMES.has(segment))) return true

  const filename = segments[segments.length - 1] ?? ''
  const lower = filename.toLowerCase()
  if (EXCLUDED_FILENAMES.has(lower)) return true
  if (EXCLUDED_FILE_SUFFIXES.some((suffix) => lower.endsWith(suffix))) return true

  return false
}

export function getFileExtension(filename: string): string | null {
  const lower = filename.toLowerCase()
  if (lower.startsWith('.') && !lower.slice(1).includes('.')) return lower.slice(1)
  if (lower.endsWith('.env.example')) return 'env.example'
  const lastDot = lower.lastIndexOf('.')
  if (lastDot === -1) return null
  return lower.slice(lastDot + 1)
}

export function isDisplayableAsText(filename: string): boolean {
  const ext = getFileExtension(filename)
  if (ext && TEXT_EXTENSIONS.has(ext)) return true
  return TEXT_FILENAMES.has(filename.toLowerCase())
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export interface ProjectTreeFile {
  kind: 'file'
  name: string
  path: string
  fileId: string
}
export interface ProjectTreeDir {
  kind: 'dir'
  name: string
  path: string
  children: ProjectTreeNode[]
}
export type ProjectTreeNode = ProjectTreeFile | ProjectTreeDir

/** Builds a nested folder tree from a flat list of {id, path}, sorted folders-first then alphabetically. */
export function buildProjectTree(files: { id: string; path: string }[]): ProjectTreeNode[] {
  const root: ProjectTreeDir = { kind: 'dir', name: '', path: '', children: [] }

  for (const file of files) {
    const segments = file.path.split('/').filter(Boolean)
    let current = root
    for (let i = 0; i < segments.length; i++) {
      const isLast = i === segments.length - 1
      const segmentPath = segments.slice(0, i + 1).join('/')
      if (isLast) {
        current.children.push({ kind: 'file', name: segments[i], path: segmentPath, fileId: file.id })
      } else {
        let dir = current.children.find((c): c is ProjectTreeDir => c.kind === 'dir' && c.name === segments[i])
        if (!dir) {
          dir = { kind: 'dir', name: segments[i], path: segmentPath, children: [] }
          current.children.push(dir)
        }
        current = dir
      }
    }
  }

  const sortTree = (nodes: ProjectTreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'dir' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
    for (const node of nodes) {
      if (node.kind === 'dir') sortTree(node.children)
    }
  }
  sortTree(root.children)

  return root.children
}
