import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { api } from '../services/api'

interface User {
  id: number
  username: string
}

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
  async function restoreSession() {
      try {
        const data = await api.get<User>("/api/auth/me")
        setUser(data)
      } catch {
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    restoreSession()
  }, [])

  const login = async (username: string, password: string) => {
    const data = await api.post<User>('/api/auth/login', { username, password })
    setUser(data)
  }

  const register = async (username: string, password: string) => {
    const data = await api.post<User>('/api/auth/register', { username, password })
    setUser(data)
  }

  const logout = async () => {
    await api.post<unknown>('/api/auth/logout', {})
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
