// Small, isolated persistence helper for the auth session. Kept separate from
// api.ts so the request layer can read the token without importing AuthContext
// (which itself depends on the *Api modules that depend on api.ts).

const AUTH_KEY = 'studyflow_auth_v1'

export interface StoredAuthUser {
  id: string
  name: string
  email: string
  timezone: string
  quietHoursEnabled: boolean
  quietHoursStart: string | null
  quietHoursEnd: string | null
  localDataMigratedAt: string | null
}

export interface StoredAuth {
  accessToken: string
  user: StoredAuthUser
}

export function loadAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.accessToken || !parsed?.user) return null
    return parsed as StoredAuth
  } catch {
    return null
  }
}

export function saveAuth(auth: StoredAuth): void {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(auth))
  } catch {
    // ignore (e.g. private browsing storage limits)
  }
}

export function clearAuth(): void {
  try {
    localStorage.removeItem(AUTH_KEY)
  } catch {
    // ignore
  }
}

export function getToken(): string | null {
  return loadAuth()?.accessToken ?? null
}
