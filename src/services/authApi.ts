import { apiRequest } from './api'
import type { StoredAuth } from './authStorage'

export interface RegisterInput {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export interface LoginInput {
  email: string
  password: string
}

export function register(input: RegisterInput): Promise<StoredAuth> {
  return apiRequest<StoredAuth>('/auth/register', { method: 'POST', body: input, skipAuth: true })
}

export function login(input: LoginInput): Promise<StoredAuth> {
  return apiRequest<StoredAuth>('/auth/login', { method: 'POST', body: input, skipAuth: true })
}

export function me(): Promise<StoredAuth['user']> {
  return apiRequest<StoredAuth['user']>('/auth/me')
}
