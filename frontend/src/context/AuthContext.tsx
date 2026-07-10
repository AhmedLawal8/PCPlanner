import { createContext, useContext, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { registerUser, loginUser, logoutUser, type AuthUser } from '../api/client'

interface AuthContextValue {
  currentUser: AuthUser | null
  signUp: (username: string, password: string) => Promise<AuthUser>
  signIn: (username: string, password: string) => Promise<AuthUser>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)

  async function signUp(username: string, password: string) {
    const user = await registerUser(username, password)
    setCurrentUser(user)
    return user
  }

  async function signIn(username: string, password: string) {
    const user = await loginUser(username, password)
    setCurrentUser(user)
    return user
  }

  async function signOut() {
    await logoutUser()
    setCurrentUser(null)
  }

  return <AuthContext.Provider value={{ currentUser, signUp, signIn, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth()
  if (!currentUser) {
    return <Navigate to="/signin" replace />
  }
  return children
}
