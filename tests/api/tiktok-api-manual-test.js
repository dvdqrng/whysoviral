/**
 * Manual test script for the TikTok account API
 * Tests various scenarios for adding TikTok accounts
 */

const TEST_UID = '6766559322627589000';  // Test UID that requires fallback
const TEST_USERNAME = 'tiktok';          // An existing, known TikTok account
const INVALID_UID = 'abc123';            // Invalid UID (not numeric)
const NONEXISTENT_USER = 'user_that_does_not_exist_123456789'; // Username that doesn't exist

async function testApi(input, description) {
  console.log(`\n=== Testing ${description} ===`);
  console.log('Input:', input);

  try {
    const apiEndpoint = 'http://localhost:3000/api/tiktok/user';

    const startTime = Date.now();
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileUrl: input })
    });
    const endTime = Date.now();

    console.log(`Response status: ${response.status} (${endTime - startTime}ms)`);

    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));

    if (data.success) {
      const userData = data.data.data.user;
      const statsData = data.data.data.stats;

      console.log('SUCCESS ✅');
      console.log(`User ID: ${userData.id}`);
      console.log(`Username: ${userData.uniqueId}`);
      console.log(`Fallback: ${data.isFallback ? 'Yes' : 'No'}`);
      console.log(`Cached: ${data.isCached ? 'Yes' : 'No'}`);
    } else {
      console.log('FAILURE ❌');
      console.log(`Error: ${data.error}`);
    }

    return { success: true, data };
  } catch (error) {
    console.log('FAILURE ❌');
    console.log('Error:', error.message);
    return { success: false, error };
  }
}

async function runAllTests() {
  console.log('====== TikTok API MANUAL TEST SUITE ======');
  console.log('Testing all methods of adding TikTok accounts\n');

  // Test 1: Valid Username
  await testApi(TEST_USERNAME, 'valid username');

  // Test 2: Username with @ symbol
  await testApi(`@${TEST_USERNAME}`, 'username with @ symbol');

  // Test 3: URL format
  await testApi(`https://www.tiktok.com/@${TEST_USERNAME}`, 'profile URL');

  // Test 4: Specific UID that needs fallback
  await testApi(TEST_UID, 'UID requiring fallback');

  // Test 5: Invalid UID
  await testApi(INVALID_UID, 'invalid UID');

  // Test 6: Nonexistent username
  await testApi(NONEXISTENT_USER, 'nonexistent username');

  console.log('\n====== TEST SUITE COMPLETED ======');
}

// Run all tests with a delay to allow the server to start
setTimeout(runAllTests, 3000); 