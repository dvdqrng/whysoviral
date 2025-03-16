'use client'

import { useEffect, useState } from 'react'
import supabase from '@/lib/supabase'

/**
 * This component synchronizes the Supabase auth session between localStorage and cookies
 * It should be included in your layout to ensure authentication works across client and server
 */
export function SessionSync() {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle')
  const [attempts, setAttempts] = useState(0)

  useEffect(() => {
    const syncSession = async () => {
      try {
        setSyncStatus('syncing')
        // Get the current session from Supabase client (pulls from localStorage)
        const { data: { session } } = await supabase.auth.getSession()

        // Check for cookies first
        const checkCookies = async () => {
          try {
            const response = await fetch('/api/auth/check-cookie', {
              method: 'GET',
              credentials: 'include',
            });

            if (response.ok) {
              const data = await response.json();
              console.log('Cookie check:', data);
              return data.hasCookie;
            }
            return false;
          } catch (error) {
            console.error('Cookie check failed:', error);
            return false;
          }
        };

        const hasCookie = await checkCookies();

        if (session) {
          console.log('Session found in localStorage, cookie exists:', hasCookie);

          // Only sync if we don't have a cookie yet or on initial load
          if (!hasCookie || attempts === 0) {
            console.log('Syncing session to cookies...');

            // Call the session-sync API to set the server-side cookie
            const response = await fetch('/api/auth/session-sync', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                session_token: JSON.stringify(session)
              })
            })

            if (!response.ok) {
              console.error('Failed to sync session:', await response.text())
              setSyncStatus('error')

              // If we get a 404, the API route might not be registered yet
              // Wait a bit and try again
              if (response.status === 404) {
                console.log('API route not found, retrying in 2 seconds...')
                setTimeout(() => {
                  setAttempts(prev => prev + 1)
                  syncSession()
                }, 2000)
              }
            } else {
              const result = await response.json()
              console.log('Session successfully synced to cookies', result)
              setSyncStatus('success')
            }
          } else {
            console.log('Cookie already exists, skipping sync');
            setSyncStatus('success');
          }
        } else {
          console.log('No session to sync')
          setSyncStatus('idle')
        }
      } catch (error) {
        console.error('Error syncing session:', error)
        setSyncStatus('error')

        // Retry after a delay
        setTimeout(() => {
          setAttempts(prev => prev + 1)
          syncSession()
        }, 3000)
      }
    }

    // Run once on component mount
    syncSession()

    // Also set up listener for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event)

      // Only sync on sign_in, token_refreshed, or user_updated events
      if (['SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) {
        syncSession()
      }

      // On sign out, clear the sync status
      if (event === 'SIGNED_OUT') {
        setSyncStatus('idle')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [attempts])

  return null
} 