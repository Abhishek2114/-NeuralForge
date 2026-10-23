import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth0 } from '@auth0/auth0-react'

interface User {
  displayName: string | null
  email: string | null
  metadata?: {
    creationTime?: string
    lastSignInTime?: string
  }
}

interface AuthContextType {
  user: User | null
  updateProfile: (data: { displayName: string; email: string }) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user: auth0User, logout: auth0Logout } = useAuth0()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    if (auth0User) {
      const userData: User = {
        displayName: auth0User.name || null,
        email: auth0User.email || null,
        metadata: {
          creationTime: auth0User.updated_at,
          lastSignInTime: auth0User.updated_at
        }
      }
      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))
    } else {
      setUser(null)
      localStorage.removeItem('user')
    }
  }, [auth0User])

  const updateProfile = async (data: { displayName: string; email: string }) => {
    const updatedUser = {
      ...user,
      displayName: data.displayName,
      email: data.email,
    }
    setUser(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
  }

  const logout = () => {
    auth0Logout({ logoutParams: { returnTo: window.location.origin } })
  }

  return (
    <AuthContext.Provider value={{ user, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 