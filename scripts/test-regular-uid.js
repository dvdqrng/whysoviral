// Script to test our API endpoint with a regular UID
const TEST_UID = '107955';  // This is a well-known TikTok official account

async function testApiWithRegularUid() {
  console.log('=== Testing API with Regular UID ===');
  console.log('UID:', TEST_UID);
  console.log('Server URL: http://localhost:3000');

  try {
    // First try to verify the server is running
    try {
      const healthCheck = await fetch('http://localhost:3000/api/hello', {
        method: 'GET'
      });

      if (!healthCheck.ok) {
        console.log('❌ Server health check failed. Status:', healthCheck.status);
        console.log('Make sure the server is running on port 3000 before running this test.');
        return;
      }

      console.log('✅ Server is running and responding');
    } catch (error) {
      console.log('❌ Could not connect to server:', error.message);
      console.log('Make sure the server is running on port 3000 before running this test.');
      return;
    }

    // Make the actual API request
    const apiEndpoint = 'http://localhost:3000/api/tiktok/user';
    console.log('Making request to:', apiEndpoint);

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ profileUrl: TEST_UID })
    });

    console.log('Response status:', response.status);

    // Check content type
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      console.log('❌ FAILURE: Received HTML response instead of JSON');
      console.log('This usually indicates the server is running on a different port.');
      console.log('Check server output for the correct port and update the test.');
      return;
    }

    const data = await response.json();
    console.log('API Response:');
    console.log(JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('✅ SUCCESS: API request was successful');
      const userData = data.data.data.user;
      const statsData = data.data.data.stats;

      console.log('User Data:');
      console.log('- User ID:', userData.id);
      console.log('- Username:', userData.uniqueId);
      console.log('- Nickname:', userData.nickname);
      console.log('- Stats:',
        `${statsData.followerCount} followers, ` +
        `${statsData.followingCount} following, ` +
        `${statsData.heart} likes, ` +
        `${statsData.videoCount} videos`
      );

      console.log('\nTest Passed: The API successfully retrieved TikTok data for a regular UID');
    } else {
      console.log('❌ FAILURE: API request failed');
      console.log('Error:', data.error);
      console.log('Details:', data.details || 'No additional details');
    }
  } catch (error) {
    console.log('❌ FAILURE: Exception occurred during test');
    console.error('Error running test:', error);
  }
}

// Make sure the server is running on port 3000 before running this script
console.log('Waiting 10 seconds for server to be ready...');
setTimeout(() => {
  testApiWithRegularUid();
}, 10000); 