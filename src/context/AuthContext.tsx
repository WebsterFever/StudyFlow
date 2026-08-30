import type { ReactNode } from 'react'
import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import * as authApi from '../services/authApi'
import type { LoginInput, RegisterInput } from '../services/authApi'
import { clearAuth, loadAuth, saveAuth, type StoredAuthUser } from '../services/authStorage'
import { UNAUTHORIZED_EVENT } from '../services/api'

interface AuthContextValue {
  user: StoredAuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  authError: string | null
  register: (input: RegisterInput) => Promise<void>
  login: (input: LoginInput) => Promise<void>
  logout: () => void
  clearAuthError: () => void
  markLocalDataMigrated: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StoredAuthUser | null>(() => loadAuth()?.user ?? null)
  const [isLoading, setIsLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  // On boot, if a session was persisted, quietly verify it's still valid.
  useEffect(() => {
    const stored = loadAuth()
    if (!stored) {
      setIsLoading(false)
      return
    }
    authApi
      .me()
      .then((freshUser) => {
        saveAuth({ accessToken: stored.accessToken, user: freshUser })
        setUser(freshUser)
      })
      .catch(() => {
        // apiRequest already clears storage + fires UNAUTHORIZED_EVENT on 401;
        // for network errors we keep the cached user so the app stays usable offline-ish.
      })
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => setUser(null)
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [])

  const register = useCallback(async (input: RegisterInput) => {
    setAuthError(null)
    try {
      const result = await authApi.register(input)
      saveAuth(result)
      setUser(result.user)
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Registration failed.')
      throw err
    }
  }, [])

  const login = useCallback(async (input: LoginInput) => {
    setAuthError(null)
    try {
      const result = await authApi.login(input)
      saveAuth(result)
      setUser(result.user)
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Login failed.')
      throw err
    }
  }, [])

  const logout = useCallback(() => {
    clearAuth()
    setUser(null)
  }, [])

  const clearAuthError = useCallback(() => setAuthError(null), [])

  const markLocalDataMigrated = useCallback(() => {
    setUser((prev) => {
      if (!prev) return prev
      const next = { ...prev, localDataMigratedAt: new Date().toISOString() }
      const stored = loadAuth()
      if (stored) saveAuth({ accessToken: stored.accessToken, user: next })
      return next
    })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user != null,
      isLoading,
      authError,
      register,
      login,
      logout,
      clearAuthError,
      markLocalDataMigrated,
    }),
    [user, isLoading, authError, register, login, logout, clearAuthError, markLocalDataMigrated],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
