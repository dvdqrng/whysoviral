import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Use environment variables with fallback to local development values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54322'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

console.log('Initializing Supabase client with URL:', supabaseUrl)

// Helper to determine cookie name
const getCookieName = () => {
  // Use the project reference from the URL to create the cookie name
  const projectRef = supabaseUrl.match(/(?:http[s]?:\/\/)([^.]+)/)?.[1] || 'localhost'
  return `sb-${projectRef}-auth-token`
}

// Create a browser-specific Supabase client
export const createClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      debug: process.env.NODE_ENV === 'development',
      storage: {
        getItem: (key) => {
          const item = localStorage.getItem(key)
          return item
        },
        setItem: (key, value) => {
          localStorage.setItem(key, value)
        },
        removeItem: (key) => {
          localStorage.removeItem(key)
        }
      }
    },
  })
}

// Export the createClient function as default
export default createClient 