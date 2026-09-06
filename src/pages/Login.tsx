import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { AuthShell } from '../components/auth/AuthShell'
import { Field, Input } from '../components/ui/Form'
import { Button } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'
import { useDefaultFlow } from '../hooks/useDefaultFlow'

export default function Login() {
  const { login } = useAuth()
  const { defaultFlow } = useDefaultFlow()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Only honor the default-flow shortcut when there's no specific deep link
  // to return to — a page that redirected here to log in always wins.
  const requestedFrom = (location.state as { from?: string } | null)?.from
  const redirectTo = requestedFrom ?? (defaultFlow === 'student' ? '/student' : defaultFlow === 'planner' ? '/planner' : '/')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login({ email, password })
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Log in to sync your study plan across devices">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email" required>
          <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password" required>
          <Input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        {error && (
          <p className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
            <AlertCircle size={14} /> {error}
          </p>
        )}
        <Button type="submit" fullWidth disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in'}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
        Don't have an account?{' '}
        <Link to="/register" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
          Create one
        </Link>
      </p>
    </AuthShell>
  )
}
