export interface CodeLanguageOption {
  value: string
  label: string
  /** Prism grammar name used for highlighting; null renders as plain unhighlighted monospace text. */
  prismLang: string | null
}

export const CODE_LANGUAGE_OPTIONS: CodeLanguageOption[] = [
  { value: 'html', label: 'HTML', prismLang: 'markup' },
  { value: 'css', label: 'CSS', prismLang: 'css' },
  { value: 'javascript', label: 'JavaScript', prismLang: 'javascript' },
  { value: 'typescript', label: 'TypeScript', prismLang: 'typescript' },
  { value: 'jsx', label: 'JSX', prismLang: 'jsx' },
  { value: 'tsx', label: 'TypeScript React', prismLang: 'tsx' },
  { value: 'react', label: 'React', prismLang: 'jsx' },
  { value: 'nodejs', label: 'Node.js', prismLang: 'javascript' },
  { value: 'nestjs', label: 'NestJS', prismLang: 'typescript' },
  { value: 'python', label: 'Python', prismLang: 'python' },
  { value: 'java', label: 'Java', prismLang: 'java' },
  { value: 'csharp', label: 'C#', prismLang: 'csharp' },
  { value: 'sql', label: 'SQL', prismLang: 'sql' },
  { value: 'json', label: 'JSON', prismLang: 'json' },
  { value: 'bash', label: 'Bash', prismLang: 'bash' },
  { value: 'other', label: 'Other', prismLang: null },
]

export function codeLanguageLabel(value: string | null): string {
  return CODE_LANGUAGE_OPTIONS.find((o) => o.value === value)?.label ?? 'Other'
}

export function codePrismLang(value: string | null): string | null {
  return CODE_LANGUAGE_OPTIONS.find((o) => o.value === value)?.prismLang ?? null
}

// Extension -> Prism grammar, for displaying uploaded project files (which
// carry a file extension, not one of the manual-code-note language values above).
const EXTENSION_PRISM_MAP: Record<string, string> = {
  html: 'markup', htm: 'markup', xml: 'markup', vue: 'markup', svelte: 'markup',
  css: 'css', scss: 'css', sass: 'css', less: 'css',
  js: 'javascript', jsx: 'jsx', mjs: 'javascript', cjs: 'javascript',
  ts: 'typescript', tsx: 'tsx',
  json: 'json', jsonc: 'json',
  py: 'python',
  java: 'java',
  cs: 'csharp',
  sql: 'sql',
  sh: 'bash', bash: 'bash', zsh: 'bash',
  yml: 'yaml', yaml: 'yaml',
  c: 'clike', cpp: 'clike', cc: 'clike', h: 'clike', hpp: 'clike',
} // eslint-disable-line prettier/prettier

export function prismLangForExtension(extension: string | null): string | null {
  if (!extension) return null
  return EXTENSION_PRISM_MAP[extension.toLowerCase()] ?? null
}
