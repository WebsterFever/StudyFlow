import { useEffect, useState } from 'react'
import { CloudUpload } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { useAuth } from '../../hooks/useAuth'
import { useStudy } from '../../hooks/useStudy'
import * as dataApi from '../../services/dataApi'
import {
  archiveLegacyData,
  dismissMigrationPromptForSession,
  isMigrationPromptDismissed,
  loadLegacyData,
} from '../../services/storage'

/**
 * One-time prompt: if this browser has data left over from the old
 * localStorage-only version of StudyFlow, offer to import it into the
 * signed-in account. Only shown once per account (server-tracked via
 * `localDataMigratedAt`) and only while the account itself is empty, so a
 * destructive "replace" import can never clobber real synced data.
 */
export function MigrationPrompt() {
  const { user, markLocalDataMigrated } = useAuth()
  const { state, isLoading, retryLoad } = useStudy()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isLoading || !user || user.localDataMigratedAt || isMigrationPromptDismissed()) return
    const accountIsEmpty = state.goals.length === 0
    if (!accountIsEmpty) return
    const legacy = loadLegacyData()
    if (legacy) setOpen(true)
  }, [isLoading, user, state.goals.length])

  const legacy = loadLegacyData()
  if (!open || !legacy) return null

  const handleImport = async () => {
    setBusy(true)
    setError(null)
    try {
      const result = await dataApi.migrateLocalData(legacy)
      if (result.migrated || result.alreadyMigrated) {
        archiveLegacyData()
        markLocalDataMigrated()
        setOpen(false)
        retryLoad()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed. Your local data is safe and untouched.')
    } finally {
      setBusy(false)
    }
  }

  const handleDismiss = () => {
    dismissMigrationPromptForSession()
    setOpen(false)
  }

  return (
    <Modal
      open={open}
      onClose={handleDismiss}
      title="Import your existing study data?"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={handleDismiss} disabled={busy}>
            Not now
          </Button>
          <Button onClick={handleImport} disabled={busy}>
            {busy ? 'Importing…' : 'Import to my account'}
          </Button>
        </>
      }
    >
      <div className="flex gap-3">
        <CloudUpload size={22} className="mt-0.5 shrink-0 text-indigo-600 dark:text-indigo-400" />
        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <p>We found existing GoalFlow data on this device from before you signed in:</p>
          <ul className="list-inside list-disc space-y-0.5">
            {legacy.goal && <li>1 study goal ({legacy.goal.name})</li>}
            <li>{legacy.items.length} study item{legacy.items.length === 1 ? '' : 's'}</li>
            <li>{legacy.sessions.length} planned session{legacy.sessions.length === 1 ? '' : 's'}</li>
          </ul>
          <p>Import it into your account so it syncs across your devices? Your local copy stays untouched either way.</p>
          {error && <p className="text-red-600 dark:text-red-400">{error}</p>}
        </div>
      </div>
    </Modal>
  )
}
