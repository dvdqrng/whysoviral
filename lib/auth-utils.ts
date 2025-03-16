import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

// Helper to get cookie name based on the Supabase URL
const getCookieName = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  if (!supabaseUrl) return 'sb-auth-token';
  
  try {
    const url = new URL(supabaseUrl);
    const hostPart = url.hostname === 'localhost' ? 'localhost' : 
                     url.hostname === '127.0.0.1' ? '127' : 
                     url.host.split('.')[0];
    return `sb-${hostPart}-auth-token`;
  } catch (e) {
    console.error('Error parsing Supabase URL for cookie name:', e);
    return 'sb-auth-token';
  }
}

/**
 * Creates a Supabase client with the authorization token from the request headers or cookies
 * This is more direct than using createRouteHandlerClient which expects cookies in a specific format
 */
export async function createDirectAuthClient(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  // First try to get token from Authorization header
  const authHeader = request.headers.get('Authorization');
  let token = null;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('[Auth Utils] Found token in Authorization header');
  } else {
    // If no Authorization header, try to get from cookie
    const cookieStore = cookies();
    const tokenCookie = cookieStore.get(getCookieName());
    
    if (tokenCookie?.value) {
      // Use the cookie value directly as the token if it looks like a JWT
      if (tokenCookie.value.startsWith('eyJ')) {
        token = tokenCookie.value;
        console.log('[Auth Utils] Found JWT token in cookie');
      } else {
        // Try to parse as JSON in case it's the full session object
        try {
          const session = JSON.parse(tokenCookie.value);
          if (session.access_token) {
            token = session.access_token;
            console.log('[Auth Utils] Found token in parsed session cookie');
          }
        } catch (e) {
          // Not valid JSON, use as-is
          token = tokenCookie.value;
          console.log('[Auth Utils] Using cookie value directly as token');
        }
      }
    }
  }
  
  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: token ? {
        Authorization: `Bearer ${token}`
      } : {}
    }
  });
  
  return supabase;
} 