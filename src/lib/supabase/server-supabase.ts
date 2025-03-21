import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Server-side Supabase client with more robust cookie handling for API routes
export function createServerSupabaseClient() {
  const cookieStore = cookies()

  // Get all cookies as a simple object
  const cookieObj: Record<string, string> = {}
  for (const cookie of cookieStore.getAll()) {
    cookieObj[cookie.name] = cookie.value
  }

  // Log available cookies (for debugging)
  console.log('Available cookies:', Object.keys(cookieObj))

  // Check specifically for Supabase auth cookies
  const sbAuthCookieKeys = Object.keys(cookieObj).filter(key =>
    key.startsWith('sb-') || key.includes('supabase')
  )

  if (sbAuthCookieKeys.length > 0) {
    console.log('Found Supabase auth cookies:', sbAuthCookieKeys)
  } else {
    console.log('No Supabase auth cookies found')
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      },
      cookies: {
        get(name) {
          console.log(`Getting cookie: ${name}`, cookieObj[name] ? 'found' : 'not found')

          // Try more variations of the cookie name if the exact name isn't found
          if (!cookieObj[name]) {
            // Check for sb-access-token when asking for sb-<project-ref>-access-token
            if (name.includes('access-token') && cookieObj['sb-access-token']) {
              console.log(`Using fallback cookie sb-access-token instead of ${name}`)
              return cookieObj['sb-access-token']
            }

            // Check for sb-refresh-token when asking for sb-<project-ref>-refresh-token
            if (name.includes('refresh-token') && cookieObj['sb-refresh-token']) {
              console.log(`Using fallback cookie sb-refresh-token instead of ${name}`)
              return cookieObj['sb-refresh-token']
            }
          }

          return cookieObj[name]
        },
      },
    }
  )

  return supabase
} 