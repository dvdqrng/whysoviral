/**
 * Test file to verify authentication requirements for TikTok API
 * 
 * This test specifically checks that the API properly requires authentication
 * and helps debug authentication-related issues.
 */

async function testAuthRequirement() {
  console.log('==== Testing TikTok API Authentication Requirement ====');
  
  try {
    // Test the API without authentication
    console.log('Testing API without authentication:');
    
    const apiEndpoint = 'http://localhost:3000/api/tiktok/user';
    
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileUrl: '@tiktok' }),
      // No authentication headers/cookies
    });
    
    console.log(`Response status: ${response.status}`);
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (response.status === 401 && data.error === 'Authentication required') {
      console.log('✅ PASS: API correctly requires authentication');
    } else {
      console.log('❌ FAIL: API should return 401 with "Authentication required" message');
    }
    
    // Print available cookies for debugging
    console.log('\nDebugging cookie information:');
    const cookies = document.cookie;
    console.log('Current cookies:', cookies || 'No cookies found');
    
    // Check for specific auth cookies
    const authCookies = [
      'sb-access-token',
      'sb-refresh-token',
      'supabase-auth-token',
      '__session'
    ];
    
    authCookies.forEach(cookieName => {
      const cookieExists = document.cookie.split(';').some(item => item.trim().startsWith(`${cookieName}=`));
      console.log(`${cookieName}: ${cookieExists ? 'Present' : 'Missing'}`);
    });
    
    console.log('\nFor this API to work, you need to:');
    console.log('1. Be logged in to the application');
    console.log('2. Ensure auth cookies are properly set');
    console.log('3. Verify server-side auth cookie reading is working');
    
  } catch (error) {
    console.log('Error during test:', error);
  }
}

// Run the test
testAuthRequirement(); 