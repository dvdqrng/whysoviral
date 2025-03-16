'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'

/**
 * This component syncs the Supabase session across tabs and ensures localStorage has correct info
 * Include this at the root of the application to make sure sessions are consistent
 */
export default function SessionSync() {
  useEffect(() => {
    const syncSession = async () => {
      try {
        // Create a new browser client instance
        const supabase = createClient()

        // Get current session
        const { data } = await supabase.auth.getSession()

        // Log for debugging
        console.log('SessionSync: Checking auth state',
          data.session ? `User ${data.session.user.email} authenticated` : 'No session')

        // Store email in localStorage for components that need it
        if (data.session?.user?.email) {
          localStorage.setItem('email', data.session.user.email)
          console.log('SessionSync: Stored email in localStorage', data.session.user.email)
        }

        // Set up auth state change listener
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
          console.log('SessionSync: Auth state changed:', event)

          if (event === 'SIGNED_IN' && session?.user?.email) {
            localStorage.setItem('email', session.user.email)
            console.log('SessionSync: SIGNED_IN - stored email in localStorage', session.user.email)
          }

          if (event === 'SIGNED_OUT') {
            localStorage.removeItem('email')
            console.log('SessionSync: SIGNED_OUT - removed email from localStorage')
          }
        })

        // Clean up the listener
        return () => {
          authListener.subscription.unsubscribe()
        }
      } catch (error) {
        console.error('Error in SessionSync:', error)
      }
    }

    syncSession()
  }, [])

  // This component does not render anything
  return null
} 