/**
 * Generates a client-side ID for new records (goals, items, sessions).
 * Returns a real UUID so these ids remain valid Postgres `uuid` primary keys
 * once synced to the backend — the frontend still creates ids optimistically
 * (e.g. so the plan generator can reference a new item's id before the
 * create request round-trips), it just needs to be UUID-shaped now.
 * `prefix` is kept for call-site compatibility but no longer used.
 */
export function generateId(_prefix = 'id'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback for environments without crypto.randomUUID (older browsers).
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
