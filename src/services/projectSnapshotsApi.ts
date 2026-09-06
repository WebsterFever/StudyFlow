import type { ProjectFileMeta, ProjectSnapshotSummary, StudyNote } from '../types'
import { apiRequest } from './api'
import { getToken } from './authStorage'

export interface ProjectFileUploadInput {
  path: string
  content: string | null
  size: number
}

export interface CreateProjectSnapshotInput {
  goalId: string
  studyItemId: string
  name: string
  files: ProjectFileUploadInput[]
}

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || 'http://localhost:3000'

/**
 * Uses XMLHttpRequest instead of apiRequest/fetch specifically so we can
 * report real upload progress (fetch has no upload-progress event) — the
 * spec calls for "Uploading project... 42%", not an indeterminate spinner.
 */
export function createProjectSnapshot(
  input: CreateProjectSnapshotInput,
  onProgress?: (percent: number) => void,
): Promise<{ note: StudyNote; snapshot: ProjectSnapshotSummary }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_URL}/project-snapshots`)
    xhr.setRequestHeader('Content-Type', 'application/json')
    const token = getToken()
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      let data: unknown
      try {
        data = xhr.responseText ? JSON.parse(xhr.responseText) : undefined
      } catch {
        data = undefined
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data as { note: StudyNote; snapshot: ProjectSnapshotSummary })
      } else {
        const message =
          data && typeof data === 'object' && 'message' in data
            ? Array.isArray((data as { message: unknown }).message)
              ? (data as { message: string[] }).message.join(' ')
              : String((data as { message: unknown }).message)
            : `Upload failed with status ${xhr.status}.`
        reject(new Error(message))
      }
    }
    xhr.onerror = () => reject(new Error('Could not reach the StudyFlow server.'))
    xhr.send(JSON.stringify(input))
  })
}

export function fetchProjectSnapshot(id: string): Promise<{ snapshot: ProjectSnapshotSummary; files: ProjectFileMeta[] }> {
  return apiRequest<{ snapshot: ProjectSnapshotSummary; files: ProjectFileMeta[] }>(`/project-snapshots/${id}`)
}
