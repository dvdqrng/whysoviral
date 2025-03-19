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
          return cookieObj[name]
        },
      },
    }
  )

  return supabase
} 