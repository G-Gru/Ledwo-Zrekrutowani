import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { getUser, fetchMe, logout as doLogout } from '@/services/auth'
import type { User } from '@/types/auth'

interface AuthContextValue {
  user: User | null
  refreshUser: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getUser())

  const refreshUser = useCallback(async () => {
    const fresh = await fetchMe()
    if (fresh) setUser(fresh)
  }, [])

  const logout = useCallback(() => {
    doLogout()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
