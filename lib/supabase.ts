import { createClient } from '@supabase/supabase-js'

// Simple check if we're in development mode
const isDev = process.env.NODE_ENV === 'development'

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

// Create a singleton Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    debug: isDev,
  },
})

// Register auth state change listener
supabase.auth.onAuthStateChange((event, session) => {
  if (isDev) {
    console.log('Auth state change:', event, session ? `User: ${session.user.id}` : 'No session')
  }
})

// Export for usage throughout app
export default supabase
export const auth = supabase.auth

// Legacy support for getSupabaseClient function
export const getSupabaseClient = () => supabase 