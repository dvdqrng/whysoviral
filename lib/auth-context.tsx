"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "./supabase"
import type { User } from "@supabase/supabase-js"

type AuthContextType = {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [previousAuthState, setPreviousAuthState] = useState<boolean>(false)

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      const isLoggedIn = !!session?.user
      setUser(session?.user ?? null)
      setLoading(false)

      // If just logged in, don't auto-refresh data, user can click refresh if needed
      // if (isLoggedIn && !previousAuthState) {
      //   checkAndRefreshDataIfNeeded()
      // }

      setPreviousAuthState(isLoggedIn)
    })

    // Listen for changes on auth state
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const isLoggedIn = !!session?.user
      setUser(session?.user ?? null)
      setLoading(false)

      // If just logged in, don't auto-refresh data, user can click refresh if needed
      // if (isLoggedIn && !previousAuthState) {
      //   checkAndRefreshDataIfNeeded()
      // }

      setPreviousAuthState(isLoggedIn)
    })

    return () => subscription.unsubscribe()
  }, [previousAuthState])

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  return useContext(AuthContext)
}

