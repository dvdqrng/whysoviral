/**
 * Utility to check authentication status and debug auth issues
 * 
 * This script helps identify why the API is returning "Authentication required"
 * by testing both the authentication status and cookie handling.
 */

// Check current auth status
async function checkAuthStatus() {
  console.log('======= Authentication Status Checker =======');

  try {
    // 1. Check if user is logged in client-side (if running in browser)
    if (typeof window !== 'undefined') {
      console.log('\n== Client-side auth check ==');

      // Print all cookies for debugging
      console.log('Available cookies:');
      const cookieStr = document.cookie;

      if (!cookieStr) {
        console.log('No cookies found. You need to be logged in.');
      } else {
        const cookies = cookieStr.split(';').map(c => c.trim());
        cookies.forEach(cookie => {
          const [name] = cookie.split('=');
          // Don't print the actual cookie values for security
          console.log(`- ${name}: [present]`);
        });

        // Check specifically for auth cookies
        const authCookies = [
          'sb-access-token',
          'sb-refresh-token',
          'supabase-auth-token'
        ];

        const missingAuthCookies = authCookies.filter(name =>
          !cookies.some(c => c.startsWith(`${name}=`))
        );

        if (missingAuthCookies.length > 0) {
          console.log('\n⚠️ Missing auth cookies:', missingAuthCookies.join(', '));
          console.log('You may not be properly logged in.');
        } else {
          console.log('\n✅ Auth cookies appear to be present.');
        }
      }
    }

    // 2. Call a simple API endpoint to check auth status server-side
    console.log('\n== Server-side auth check ==');
    console.log('Checking auth status via API call...');

    const response = await fetch('/api/tiktok/auth-check', {
      method: 'GET',
    });

    console.log(`API response status: ${response.status}`);

    const data = await response.json();
    console.log('Response:', data);

    if (data.authenticated) {
      console.log('✅ Server recognizes you as authenticated');
      console.log(`User ID: ${data.userId}`);
    } else {
      console.log('❌ Server does not recognize you as authenticated');
      console.log('Reason:', data.message || 'Unknown');
    }

    // 3. Provide recommendations
    console.log('\n== Recommendations ==');
    if (!data.authenticated) {
      console.log('1. Try logging out and logging in again');
      console.log('2. Check if cookies are enabled in your browser');
      console.log('3. Clear browser cache and cookies, then try again');
      console.log('4. Make sure you\'re using the correct account');
    }
  } catch (error) {
    console.error('Error checking auth status:', error);
  }
}

// Run the check
checkAuthStatus(); 