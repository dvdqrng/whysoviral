import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple list of paths that require authentication
const PROTECTED_PATHS = [
  '/dashboard', 
  '/api/tiktok',
  '/api/teams'
]

// Paths that should be excluded from authentication checks
const PUBLIC_PATHS = [
  '/auth/login',
  '/auth/signup',
  '/auth/verify',
  '/api/auth/session-sync',
  '/api/auth/check-cookie',
  '/_next',
  '/favicon.ico',
  '/public'
]

// Simple check if path is protected
const isProtectedPath = (path: string) => {
  return PROTECTED_PATHS.some(prefix => path.startsWith(prefix))
}

// Check if path is public
const isPublicPath = (path: string) => {
  return PUBLIC_PATHS.some(prefix => path.startsWith(prefix))
}

export async function middleware(request: NextRequest) {
  // Create a response object
  const res = NextResponse.next()
  
  // Skip middleware for public paths
  if (isPublicPath(request.nextUrl.pathname)) {
    return res
  }
  
  try {
    // Create Supabase client
    const supabase = createMiddlewareClient({ 
      req: request, 
      res,
    })
    
    // Enhanced cookie debugging
    const cookieHeader = request.headers.get('cookie')
    console.log(`[Middleware] Cookies: ${cookieHeader || 'Missing'}`)
    
    // Find auth cookie with dynamically generated name pattern (sb-*-auth-token)
    const allCookies = request.cookies.getAll()
    const authCookie = allCookies.find(cookie => 
      cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
    )
    console.log(`[Middleware] Auth Cookie: ${authCookie ? authCookie.name : 'Missing'}`)
    
    // Get user session
    let session = null
    let sessionError = null
      
    try {
      const { data, error } = await supabase.auth.getSession()
      session = data?.session
      sessionError = error
      
      if (error) {
        console.error('[Middleware] Session error:', error)
      }
    } catch (error) {
      console.error('[Middleware] Error fetching session:', error)
      sessionError = error
    }
      
    // Improved AJAX detection
    const isAjaxRequest = 
      request.headers.get('X-Requested-With') === 'XMLHttpRequest' || 
      request.headers.get('Accept')?.includes('application/json') ||
      request.headers.get('Content-Type')?.includes('application/json') ||
      request.method !== 'GET';
      
    // Log authentication status
    console.log(`[Middleware] Path: ${request.nextUrl.pathname}, Authenticated: ${!!session}, AJAX: ${!!isAjaxRequest}`)
    
    if (session) {
      console.log(`[Middleware] User authenticated: ${session.user.id} (${session.user.email})`)
    } else {
      console.log(`[Middleware] No authenticated user found`)
    }
    
    // Handle protected paths
    if (isProtectedPath(request.nextUrl.pathname) && !session) {
      // For AJAX or API requests, return 401
      if (isAjaxRequest || request.nextUrl.pathname.startsWith('/api/')) {
        console.log(`[Middleware] Returning 401 for ${isAjaxRequest ? 'AJAX' : 'API'} request to ${request.nextUrl.pathname}`)
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
        
      // For page requests, redirect to login
      console.log(`[Middleware] Redirecting unauthenticated user to login from protected path: ${request.nextUrl.pathname}`)
      const redirectUrl = new URL('/auth/login', request.url)
      redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
    
    // For authenticated users accessing protected routes
    if (session) {
      console.log(`[Middleware] Allowing authenticated user to access: ${request.nextUrl.pathname}`)
      
      // For API requests, add auth header
      if (request.nextUrl.pathname.startsWith('/api/')) {
        console.log(`[Middleware] Allowing AJAX API request to pass through: ${request.nextUrl.pathname}`)
      }
    }
    
    return res
  } catch (error) {
    console.error('[Middleware] Critical error in middleware:', error)
    // Don't allow access to protected routes even in case of middleware errors
    if (isProtectedPath(request.nextUrl.pathname)) {
      // For AJAX or API requests, return 401
      const isAjaxRequest = 
        request.headers.get('X-Requested-With') === 'XMLHttpRequest' || 
        request.headers.get('Accept')?.includes('application/json') ||
        request.headers.get('Content-Type')?.includes('application/json') ||
        request.method !== 'GET';
        
      if (isAjaxRequest || request.nextUrl.pathname.startsWith('/api/')) {
        console.log(`[Middleware] Returning 401 for protected path due to middleware error: ${request.nextUrl.pathname}`)
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
      
      // For page requests, redirect to login
      console.log(`[Middleware] Redirecting to login from protected path due to middleware error: ${request.nextUrl.pathname}`)
      const redirectUrl = new URL('/auth/login', request.url)
      redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
    
    // Only allow non-protected routes to proceed in case of errors
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}

