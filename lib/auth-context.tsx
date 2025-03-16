"use client"

import { createContext, useContext, useEffect, useState } from "react"
import supabase, { auth } from "./supabase"
import type { User } from "@supabase/supabase-js"

type AuthContextType = {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => { },
  refreshUser: async () => { }
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Function to refresh the user data
  const refreshUser = async () => {
    try {
      const { data, error } = await auth.getUser()
      if (error) {
        console.error('Error refreshing user:', error)
        return
      }
      setUser(data?.user ?? null)
    } catch (err) {
      console.error('Error in refreshUser:', err)
    }
  }

  // Sign out function
  const signOut = async () => {
    try {
      await auth.signOut()
      setUser(null)
    } catch (err) {
      console.error('Error signing out:', err)
    }
  }

  useEffect(() => {
    // Check active sessions and sets the user
    auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for changes on auth state
    const {
      data: { subscription },
    } = auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  return useContext(AuthContext)
}

