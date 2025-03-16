import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { session_token } = await request.json()
    
    if (!session_token) {
      return NextResponse.json({ 
        success: false, 
        error: 'No session token provided' 
      }, { status: 400 })
    }
    
    // Get the cookie name - should match the one in supabase.ts
    const cookieName = getCookieName()
    
    // Log for debugging
    console.log(`Setting cookie ${cookieName} with session data`)
    
    // Set the session cookie
    cookies().set({
      name: cookieName, 
      value: session_token,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })
    
    // Create a Supabase client to verify the session works
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Verify the session
    const { data, error } = await supabase.auth.getSession()
    
    if (error || !data.session) {
      console.error('Failed to verify session after setting cookie:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to verify session after setting cookie',
        details: error?.message
      }, { status: 500 })
    }
    
    console.log('Session successfully verified:', data.session.user.id)
    
    return NextResponse.json({ 
      success: true,
      user: {
        id: data.session.user.id,
        email: data.session.user.email
      }
    })
  } catch (error) {
    console.error('Error syncing session:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

// Helper to determine cookie name (should match lib/supabase.ts)
function getCookieName() {
  return 'sb-localhost-auth-token';
} 