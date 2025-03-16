import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Get the cookie name - should match the one in supabase.ts
    const cookieName = getCookieName()
    
    // Check if the cookie exists
    const cookieStore = cookies()
    const hasAuthCookie = cookieStore.has(cookieName)
    
    console.log(`[check-cookie] Cookie ${cookieName} exists: ${hasAuthCookie}`)
    
    // Verify the session if the cookie exists
    let isValidSession = false
    if (hasAuthCookie) {
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
      const { data, error } = await supabase.auth.getSession()
      
      isValidSession = !!data.session && !error
      console.log(`[check-cookie] Valid session: ${isValidSession}`, error || '')
    }
    
    return NextResponse.json({ 
      hasCookie: hasAuthCookie,
      isValidSession: isValidSession
    })
  } catch (error) {
    console.error('Error checking cookie:', error)
    return NextResponse.json({ 
      hasCookie: false,
      isValidSession: false,
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

// Helper to determine cookie name (should match lib/supabase.ts)
function getCookieName() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  
  if (!supabaseUrl) return 'sb-auth-token'
  
  try {
    const url = new URL(supabaseUrl)
    const hostPart = url.hostname === 'localhost' ? 'localhost' : 
                   url.hostname === '127.0.0.1' ? '127' : 
                   url.host.split('.')[0]
    return `sb-${hostPart}-auth-token`
  } catch (e) {
    console.error('Error parsing Supabase URL for cookie name:', e)
    return 'sb-auth-token'
  }
} 