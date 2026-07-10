import type { PartOption } from '../constants/parts'

const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000/api'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })

  const body: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const errorMessage =
      body && typeof body === 'object' && 'error' in body ? String((body as { error: unknown }).error) : 'Request failed.'
    throw new ApiError(errorMessage, response.status)
  }

  return body as T
}

export interface AuthUser {
  id: number
  username: string
}

export function registerUser(username: string, password: string) {
  return apiFetch<AuthUser>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export function loginUser(username: string, password: string) {
  return apiFetch<AuthUser>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export function logoutUser() {
  return apiFetch<{ message: string }>('/auth/logout', { method: 'POST' })
}

export interface GenerateBuildResult {
  parts: Record<string, PartOption[]>
  total_price: number
  summary: string
}

export function generateBuild(budgetAmount: number, useCase: string, priority: string | null) {
  return apiFetch<GenerateBuildResult>('/builds/generate', {
    method: 'POST',
    body: JSON.stringify({ budget: budgetAmount, use_case: useCase, priority }),
  })
}

export interface SavedBuildPart {
  id: number
  name: string
  price: number
}

export interface SavedBuild {
  id: number
  name: string
  total_price: number
  summary: string
  created_at: string
  parts: Record<string, SavedBuildPart>
}

export interface SaveBuildPayload {
  name: string
  total_price: number
  summary: string
  parts: Record<string, { id: number }>
}

export function saveBuild(payload: SaveBuildPayload) {
  return apiFetch<SavedBuild>('/builds/save', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listBuilds() {
  return apiFetch<SavedBuild[]>('/builds/')
}

export function deleteBuild(buildId: number) {
  return apiFetch<{ message: string }>(`/builds/${buildId}`, { method: 'DELETE' })
}

export interface GuideVideo {
  video_id: string
  title: string
  thumbnail_url: string
  channel_title: string
  url: string
  topic?: string
}

export function getGeneralGuides() {
  return apiFetch<GuideVideo[]>('/guides')
}

export function getPartGuide(category: string, name: string) {
  const query = new URLSearchParams({ category, name })
  return apiFetch<GuideVideo | null>(`/guides/part?${query}`)
}
