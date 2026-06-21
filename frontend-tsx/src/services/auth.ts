import { apiClient, BASE_URL } from '@/api/client'
import type { User } from '@/types/auth'

const decodeBase64Url = (value: string): string | null => {
  try {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = atob(base64)
    return decodeURIComponent(decoded.split('').map((c) => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`).join(''))
  } catch { return null }
}

const parseJwtPayload = (token: string): Record<string, unknown> | null => {
  if (!token || token.split('.').length !== 3) return null
  const decoded = decodeBase64Url(token.split('.')[1])
  if (!decoded) return null
  try { return JSON.parse(decoded) } catch { return null }
}

export const isTokenExpired = (token: string): boolean => {
  const payload = parseJwtPayload(token)
  if (!payload || typeof payload.exp !== 'number') return false
  return Math.floor(Date.now() / 1000) >= payload.exp
}

export const getAccessToken = (): string | null => localStorage.getItem('user-access-token')
export const getRefreshToken = (): string | null => localStorage.getItem('user-refresh-token')
export const getUser = (): User | null => {
  const raw = localStorage.getItem('user-data')
  return raw ? (JSON.parse(raw) as User) : null
}
export const isLoggedIn = (): boolean => !!getAccessToken()

export const login = async (email: string, password: string) => {
  const response = await apiClient<{ access: string; refresh: string; user: User }>(
    `${BASE_URL}/api/auth/login`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) }
  )
  localStorage.setItem('user-access-token', response.access)
  localStorage.setItem('user-refresh-token', response.refresh)
  localStorage.setItem('user-data', JSON.stringify(response.user))
  return response
}

export const logout = () => {
  localStorage.removeItem('user-access-token')
  localStorage.removeItem('user-refresh-token')
  localStorage.removeItem('user-data')
  window.location.href = '/studies'
}

export const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken()
  if (!refreshToken) { logout(); return null }
  try {
    const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    })
    if (!response.ok) throw new Error('Refresh failed')
    const data = await response.json() as { access: string; refresh?: string }
    localStorage.setItem('user-access-token', data.access)
    if (data.refresh) localStorage.setItem('user-refresh-token', data.refresh)
    return data.access
  } catch { logout(); return null }
}

export const fetchMe = async (): Promise<User | null> => {
  const token = getAccessToken()
  if (!token) return null
  try {
    const response = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) return null
    const user = await response.json() as User
    localStorage.setItem('user-data', JSON.stringify(user))
    return user
  } catch { return null }
}

export const changePassword = async (oldPassword: string, newPassword: string) => {
  const token = getAccessToken()
  const response = await fetch(`${BASE_URL}/api/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as Record<string, unknown>
    throw new Error((err.detail as string) || 'Błąd zmiany hasła')
  }
}

export const register = async (userData: Record<string, unknown>) => {
  return apiClient(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  })
}
