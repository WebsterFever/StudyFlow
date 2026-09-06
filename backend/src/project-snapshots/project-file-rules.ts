// Server-side is the authoritative copy of these rules — the frontend applies
// the same filtering before upload purely to save bandwidth and give instant
// feedback, but must never be trusted on its own.

export const MAX_FILE_SIZE_BYTES = 150 * 1024; // 150KB per file
export const MAX_TOTAL_SIZE_BYTES = 15 * 1024 * 1024; // 15MB per project snapshot
export const MAX_FILE_COUNT = 500;

const EXCLUDED_DIR_NAMES = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage']);

const EXCLUDED_FILENAMES = new Set(['.env', '.env.local', '.env.production', '.env.development', 'credentials.json']);

const EXCLUDED_FILE_SUFFIXES = ['.pem', '.key'];

// Extensions (and a few full filenames, for extension-less files like
// Dockerfile) whose content is safe and useful to display as text.
const TEXT_EXTENSIONS = new Set([
  'ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs',
  'html', 'htm', 'css', 'scss', 'sass', 'less',
  'json', 'jsonc', 'md', 'mdx', 'txt',
  'py', 'java', 'cs', 'sql', 'sh', 'bash', 'zsh',
  'yml', 'yaml', 'xml', 'vue', 'svelte',
  'c', 'cpp', 'cc', 'h', 'hpp', 'go', 'rb', 'php', 'rs', 'kt', 'swift',
  'toml', 'ini', 'gradle', 'gitignore', 'editorconfig', 'env.example',
]); // eslint-disable-line prettier/prettier

const TEXT_FILENAMES = new Set(['dockerfile', 'makefile', 'procfile', 'license']);

/** True if any path segment matches an excluded directory name (node_modules, .git, etc). */
export function isPathExcluded(path: string): boolean {
  const segments = path.split('/').filter(Boolean);
  if (segments.some((segment) => EXCLUDED_DIR_NAMES.has(segment))) return true;

  const filename = segments[segments.length - 1] ?? '';
  const lower = filename.toLowerCase();
  if (EXCLUDED_FILENAMES.has(lower)) return true;
  if (EXCLUDED_FILE_SUFFIXES.some((suffix) => lower.endsWith(suffix))) return true;

  return false;
}

/** Returns the extension for matching purposes — handles dotfiles (.gitignore -> "gitignore") and no-extension names. */
export function getFileExtension(filename: string): string | null {
  const lower = filename.toLowerCase();
  if (lower.startsWith('.') && !lower.slice(1).includes('.')) {
    return lower.slice(1); // ".gitignore" -> "gitignore"
  }
  if (lower.endsWith('.env.example')) return 'env.example';
  const lastDot = lower.lastIndexOf('.');
  if (lastDot === -1) return null;
  return lower.slice(lastDot + 1);
}

export function isDisplayableAsText(filename: string): boolean {
  const ext = getFileExtension(filename);
  if (ext && TEXT_EXTENSIONS.has(ext)) return true;
  return TEXT_FILENAMES.has(filename.toLowerCase());
}
