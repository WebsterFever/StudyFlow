import { useRef, useState } from 'react'
import { AlertCircle, Bell, CheckCircle2, Database, Download, LogOut, Mail, Sparkles, Trash2, Upload, User as UserIcon } from 'lucide-react'
import { useStudy } from '../hooks/useStudy'
import { useAuth } from '../hooks/useAuth'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Field, Input, Select } from '../components/ui/Form'
import { readJsonFile } from '../services/storage'
import type { MultiGoalPayload } from '../services/dataApi'
import * as usersApi from '../services/usersApi'

const TIMEZONE_OPTIONS: string[] =
  typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : ['UTC']

export default function Settings() {
  const { exportData, importData, resetData, loadDemoData } = useStudy()
  const { user, logout, setUserProfile } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [importBusy, setImportBusy] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmDemo, setConfirmDemo] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)

  const [timezone, setTimezone] = useState(user?.timezone ?? 'UTC')
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(user?.quietHoursEnabled ?? false)
  const [quietHoursStart, setQuietHoursStart] = useState(user?.quietHoursStart ?? '22:00')
  const [quietHoursEnd, setQuietHoursEnd] = useState(user?.quietHoursEnd ?? '07:00')
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileBusy, setProfileBusy] = useState(false)

  const handleSaveProfile = async () => {
    setProfileError(null)
    setProfileSaved(false)
    setProfileBusy(true)
    try {
      const updated = await usersApi.updateProfile({
        timezone,
        quietHoursEnabled,
        quietHoursStart: quietHoursEnabled ? quietHoursStart : null,
        quietHoursEnd: quietHoursEnabled ? quietHoursEnd : null,
      })
      setUserProfile(updated)
      setProfileSaved(true)
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to save profile settings.')
    } finally {
      setProfileBusy(false)
    }
  }

  const handleImportClick = () => fileInputRef.current?.click()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setImportBusy(true)
    try {
      const data = await readJsonFile<MultiGoalPayload>(file)
      if (!data || !Array.isArray(data.goals)) {
        throw new Error('That file does not look like a valid StudyFlow backup.')
      }
      await importData(data)
      setImportError(null)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to import file.')
    } finally {
      setImportBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="Account" subtitle="Signed in — your data syncs across every device you log into" />
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <UserIcon size={15} className="text-slate-400" /> {user?.name}
          </div>
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Mail size={15} className="text-slate-400" /> {user?.email}
          </div>
        </div>
        <div className="mt-4">
          <Button variant="secondary" icon={<LogOut size={16} />} onClick={() => setConfirmLogout(true)}>
            Log out
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader title="Reminder preferences" subtitle="Controls when email reminders are allowed to reach you" />
        <div className="space-y-4">
          <Field label="Timezone" hint="Used to determine your local time for quiet hours and daily progress.">
            <Select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
              {TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </Select>
          </Field>

          <div>
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={quietHoursEnabled}
                onChange={(e) => setQuietHoursEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600"
              />
              Enable quiet hours (skip reminders during this window)
            </label>

            {quietHoursEnabled && (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Quiet hours start">
                  <Input type="time" value={quietHoursStart} onChange={(e) => setQuietHoursStart(e.target.value)} />
                </Field>
                <Field label="Quiet hours end">
                  <Input type="time" value={quietHoursEnd} onChange={(e) => setQuietHoursEnd(e.target.value)} />
                </Field>
              </div>
            )}
          </div>

          {profileError && (
            <p className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
              <AlertCircle size={14} /> {profileError}
            </p>
          )}
          {profileSaved && !profileError && (
            <p className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={14} /> Saved.
            </p>
          )}

          <Button icon={<Bell size={16} />} onClick={handleSaveProfile} disabled={profileBusy}>
            {profileBusy ? 'Saving…' : 'Save reminder preferences'}
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader title="Demo data" subtitle="Add a sample goal covering HTML, CSS, JavaScript, TypeScript and React" />
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
          This adds a new "Master Frontend Development" goal alongside any goals you already have, so you can try StudyFlow immediately without
          losing anything. You can delete it any time from the Goals page.
        </p>
        <Button variant="secondary" icon={<Sparkles size={16} />} onClick={() => setConfirmDemo(true)}>
          Add demo goal
        </Button>
      </Card>

      <Card>
        <CardHeader title="Backup & restore" subtitle="Your data lives in the cloud — these are just manual backup copies" />
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={<Download size={16} />} onClick={exportData}>
            Export data
          </Button>
          <Button variant="secondary" icon={<Upload size={16} />} onClick={handleImportClick} disabled={importBusy}>
            {importBusy ? 'Importing…' : 'Import data'}
          </Button>
          <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleFileChange} />
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Importing replaces every goal, all content and every schedule in your account.</p>
        {importError && (
          <p className="mt-3 flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
            <AlertCircle size={14} /> {importError}
          </p>
        )}
      </Card>

      <Card className="border-red-200 dark:border-red-900">
        <CardHeader title="Danger zone" subtitle="This cannot be undone" />
        <div className="flex items-center gap-3 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">
          <Database size={16} />
          Reset all data — deletes every goal, all content, sessions and history from your account.
        </div>
        <div className="mt-3">
          <Button variant="danger" icon={<Trash2 size={16} />} onClick={() => setConfirmReset(true)}>
            Reset all data
          </Button>
        </div>
      </Card>

      <ConfirmDialog
        open={confirmReset}
        title="Reset all data?"
        message="This will permanently delete every goal, all study content, plans and history from your account. This cannot be undone."
        confirmLabel="Reset everything"
        danger
        onConfirm={() => {
          resetData()
          setConfirmReset(false)
        }}
        onCancel={() => setConfirmReset(false)}
      />

      <ConfirmDialog
        open={confirmDemo}
        title="Add demo goal?"
        message="This adds a new sample goal with ready-made content alongside your existing goals."
        confirmLabel="Add demo goal"
        onConfirm={() => {
          loadDemoData()
          setConfirmDemo(false)
        }}
        onCancel={() => setConfirmDemo(false)}
      />

      <ConfirmDialog
        open={confirmLogout}
        title="Log out?"
        message="You'll need to log back in to see your study data again on this device."
        confirmLabel="Log out"
        onConfirm={() => {
          logout()
          setConfirmLogout(false)
        }}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  )
}
