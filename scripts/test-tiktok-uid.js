// Simple script to test the TikTok user info API with a specific UID
// Using dynamic import for ESM modules
const TEST_UID = '6766559322627589000';

// Using the API key directly from the .env file
const RAPID_API_KEY = 'f5d1282963mshef0d5772caaead9p1c1ee3jsn5ad444ffd3d7';
const TIKTOK_API_HOST = 'tiktok-scraper7.p.rapidapi.com';

async function testUserInfo() {
  console.log('=== Testing TikTok User Info with UID ===');
  console.log('UID:', TEST_UID);

  // Use native fetch instead of node-fetch
  const cleanUserId = TEST_UID.trim().replace(/\D/g, '');
  console.log('Clean UID:', cleanUserId);

  const endpoint = `https://${TIKTOK_API_HOST}/user/info`;
  const url = `${endpoint}?user_id=${cleanUserId}`;

  console.log('Making request to:', url);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPID_API_KEY,
        'x-rapidapi-host': TIKTOK_API_HOST,
        'Content-Type': 'application/json'
      }
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Request failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      return;
    }

    const data = await response.json();
    console.log('Response structure:', Object.keys(data));

    if (!data.data?.user) {
      console.error('Invalid response format - missing user data');
      console.log('Full response:', JSON.stringify(data, null, 2));
      return;
    }

    console.log('User Info:');
    console.log('- User ID:', data.data.user.id);
    console.log('- Username:', data.data.user.uniqueId);
    console.log('- Nickname:', data.data.user.nickname);
    console.log('- Verified:', data.data.user.verified);
    console.log('Stats:');
    console.log('- Followers:', data.data.stats.followerCount);
    console.log('- Following:', data.data.stats.followingCount);
    console.log('- Likes:', data.data.stats.heart);
    console.log('- Videos:', data.data.stats.videoCount);

    console.log('Test completed successfully');
  } catch (error) {
    console.error('Error running test:', error);
  }
}

// Run the test
testUserInfo(); 