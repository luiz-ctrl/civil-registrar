import { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Only check auth if we're on an admin page
    if (window.location.pathname.startsWith('/admin')) {
      api.get('/auth/me')
        .then(r => setUser(r.data))
        .catch(() => setUser(null))
        .finally(() => setLoading(false))
    } else {
      // Not on admin page, skip auth check
      setLoading(false)
    }
  }, [])

  const login = async (username, password) => {
    const r = await api.post('/auth/login', { username, password })
    setUser(r.data)
    return r.data
  }

  const logout = async () => {
    await api.post('/auth/logout')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
