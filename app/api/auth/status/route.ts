import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createDirectAuthClient } from '@/lib/auth-utils'

export async function GET(request: Request) {
  try {
    // Log headers for debugging
    console.log('Auth status check - Request headers:', 
      Object.fromEntries(
        Array.from(request.headers.entries())
          .filter(([key]) => !key.includes('sec-') && !key.includes('accept-encoding'))
      )
    )
    
    // Get all cookies for debugging
    const cookieStore = cookies()
    const allCookies = cookieStore.getAll()
    console.log('Auth status check - Cookies:', allCookies.map(c => c.name).join(', '))
    
    // Create Supabase client with direct auth
    const supabase = await createDirectAuthClient(request)
    
    // Check session
    const { data, error } = await supabase.auth.getUser()
    
    console.log('Auth status check - User result:', {
      hasData: !!data,
      hasUser: !!data?.user,
      error: error?.message || null
    })
    
    if (error) {
      return NextResponse.json({ 
        authenticated: false, 
        error: error.message,
        message: "Error checking authentication status"
      }, { status: 500 })
    }
    
    if (!data.user) {
      return NextResponse.json({ 
        authenticated: false,
        message: "No user found",
        cookies: allCookies.map(c => c.name)
      }, { status: 200 })
    }
    
    return NextResponse.json({
      authenticated: true,
      user: {
        id: data.user.id,
        email: data.user.email
      },
      message: "User is authenticated"
    }, { status: 200 })
  } catch (error) {
    console.error('Error in auth status API:', error)
    return NextResponse.json({
      authenticated: false,
      error: error instanceof Error ? error.message : "Unknown error",
      message: "Exception occurred checking authentication"
    }, { status: 500 })
  }
} 