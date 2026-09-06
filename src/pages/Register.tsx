import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { AuthShell } from '../components/auth/AuthShell'
import { Field, Input } from '../components/ui/Form'
import { Button } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'
import { useDefaultFlow } from '../hooks/useDefaultFlow'

export default function Register() {
  const { register } = useAuth()
  const { defaultFlow } = useDefaultFlow()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setSubmitting(true)
    try {
      await register({ name, email, password, confirmPassword })
      navigate(defaultFlow === 'student' ? '/student' : defaultFlow === 'planner' ? '/planner' : '/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell title="Create your account" subtitle="Study on your computer and pick up right where you left off on your phone">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Name" required>
          <Input autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Email" required>
          <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password" required hint="At least 8 characters">
          <Input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Field label="Confirm password" required>
          <Input
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </Field>
        {error && (
          <p className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
            <AlertCircle size={14} /> {error}
          </p>
        )}
        <Button type="submit" fullWidth disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
          Log in
        </Link>
      </p>
    </AuthShell>
  )
}
