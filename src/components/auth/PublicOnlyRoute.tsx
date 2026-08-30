import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

/** Keeps a logged-in user off /login and /register. */
export function PublicOnlyRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
