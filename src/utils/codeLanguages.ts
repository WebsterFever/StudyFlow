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
