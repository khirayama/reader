'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
// User型を直接定義
interface User {
  id: string
  email: string
  theme: 'SYSTEM' | 'LIGHT' | 'DARK'
  language: 'JA' | 'EN'
  createdAt: string
  updatedAt: string
}
import { sdk, saveToken, clearToken } from '@/lib/sdk'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const isAuthenticated = user !== null

  // 初期化時にプロフィールを取得
  useEffect(() => {
    const initAuth = async () => {
      if (sdk.isAuthenticated()) {
        try {
          const profile = await sdk.auth.getProfile()
          setUser(profile)
        } catch (error) {
          // トークンが無効な場合はクリア
          clearToken()
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  // トークン期限切れイベントのリスナー
  useEffect(() => {
    const handleTokenExpired = () => {
      setUser(null)
      clearToken()
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('auth:token-expired', handleTokenExpired)
      return () => {
        window.removeEventListener('auth:token-expired', handleTokenExpired)
      }
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await sdk.auth.login({ email, password })
      saveToken(response.token)
      setUser(response.user)
    } catch (error) {
      throw error
    }
  }

  const register = async (email: string, password: string) => {
    try {
      const response = await sdk.auth.register({ email, password })
      saveToken(response.token)
      setUser(response.user)
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    setUser(null)
    clearToken()
    sdk.auth.logout()
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
