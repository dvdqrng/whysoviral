// Test script for creating a fallback profile when the TikTok API fails
const TEST_UID = '6766559322627589000';

function createFallbackProfileResponse(uid) {
  const username = `user_${uid.substring(0, 8)}`;

  return {
    data: {
      user: {
        id: uid,
        uniqueId: username,
        nickname: `TikTok User ${uid.substring(0, 6)}`,
        avatarThumb: "https://p16-sign-va.tiktokcdn.com/tos-maliva-avt-0068/placeholder.jpg",
        signature: "Profile data pending...",
        verified: false
      },
      stats: {
        followerCount: 0,
        followingCount: 0,
        heart: 0,
        videoCount: 0
      }
    }
  };
}

// Simulate what happens in the API route
function processUserData(uid) {
  console.log('=== Processing User ID ===');
  console.log('UID:', uid);

  const cleanUserId = uid.trim().replace(/\D/g, '');
  console.log('Clean UID:', cleanUserId);

  // Simulate API failure and fallback
  console.log('Simulating API failure...');
  const fallbackResponse = createFallbackProfileResponse(cleanUserId);
  console.log('Created fallback response');

  // Format the response like our app expects
  const transformedData = {
    data: {
      user: {
        id: fallbackResponse.data.user.id,
        uniqueId: fallbackResponse.data.user.uniqueId,
        nickname: fallbackResponse.data.user.nickname,
        avatarThumb: fallbackResponse.data.user.avatarThumb,
        signature: fallbackResponse.data.user.signature,
        verified: fallbackResponse.data.user.verified
      },
      stats: {
        followerCount: fallbackResponse.data.stats.followerCount,
        followingCount: fallbackResponse.data.stats.followingCount,
        heart: fallbackResponse.data.stats.heart,
        videoCount: fallbackResponse.data.stats.videoCount
      }
    }
  };

  console.log('Transformed response:');
  console.log(JSON.stringify(transformedData, null, 2));

  // Create the database object
  const userData = {
    user_id: transformedData.data.user.id,
    username: transformedData.data.user.uniqueId,
    nickname: transformedData.data.user.nickname,
    followers: transformedData.data.stats.followerCount,
    following: transformedData.data.stats.followingCount,
    likes: transformedData.data.stats.heart,
    videos: transformedData.data.stats.videoCount,
    verified: transformedData.data.user.verified,
    bio: transformedData.data.user.signature,
    avatar: transformedData.data.user.avatarThumb,
    profile_url: `https://www.tiktok.com/@${transformedData.data.user.uniqueId}`
  };

  console.log('Database object:');
  console.log(JSON.stringify(userData, null, 2));

  return userData;
}

// Run the test
const result = processUserData(TEST_UID);
console.log('Test completed successfully'); 