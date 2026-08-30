import { apiRequest } from './api'
import type { StoredAuthUser } from './authStorage'

export interface UpdateProfileInput {
  timezone?: string
  quietHoursEnabled?: boolean
  quietHoursStart?: string | null
  quietHoursEnd?: string | null
}

export function updateProfile(input: UpdateProfileInput): Promise<StoredAuthUser> {
  return apiRequest<StoredAuthUser>('/users/me', { method: 'PATCH', body: input })
}
