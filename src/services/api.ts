import { clearAuth, getToken } from './authStorage'

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || 'http://localhost:3000'

export class ApiError extends Error {
  status: number
  isNetworkError: boolean

  constructor(message: string, status: number, isNetworkError = false) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.isNetworkError = isNetworkError
  }
}

/** Dispatched whenever a request comes back 401 so AuthContext can log the user out. */
export const UNAUTHORIZED_EVENT = 'studyflow:unauthorized'

function extractMessage(body: unknown, fallback: string): string {
  if (body && typeof body === 'object' && 'message' in body) {
    const message = (body as { message: unknown }).message
    if (Array.isArray(message)) return message.join(' ')
    if (typeof message === 'string') return message
  }
  return fallback
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  skipAuth?: boolean
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, skipAuth = false } = options

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (!skipAuth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('Could not reach the StudyFlow server. Check your connection and try again.', 0, true)
  }

  if (response.status === 401 && !skipAuth) {
    clearAuth()
    window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT))
  }

  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  const data = text ? JSON.parse(text) : undefined

  if (!response.ok) {
    throw new ApiError(extractMessage(data, `Request failed with status ${response.status}.`), response.status)
  }

  return data as T
}
