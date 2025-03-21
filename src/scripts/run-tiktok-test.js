/**
 * Test script for adding a TikTok account with a specific UID
 * 
 * Copy and paste this entire script into your browser console to run it
 */

(async function () {
  console.log('%c=== TikTok Account Test ===', 'color: blue; font-weight: bold; font-size: 16px;');

  const testUID = '6865486669187171334'; // IShowSpeed account

  try {
    // Step 1: Attempt to add the account
    console.log(`%cAttempting to add account with UID: ${testUID}`, 'color: blue');

    const response = await fetch('/api/tiktok/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ profileUrl: testUID }),
      credentials: 'include',
    });

    console.log(`Response status: ${response.status}`);
    const data = await response.json();

    if (data.success) {
      console.log('%c✅ API call successful!', 'color: green; font-weight: bold');
      console.log('User data:', data.data.data.user);

      // Check if user appears in profiles list
      console.log('%cChecking for user in profiles...', 'color: blue');

      setTimeout(async () => {
        // Fetch profiles to verify account was added
        const profilesResponse = await fetch('/api/tiktok/profiles?userId=721af791-fdba-4c9f-b2c5-4e59d9e9207b', {
          credentials: 'include'
        });

        const profilesData = await profilesResponse.json();

        if (profilesData.success && profilesData.data && profilesData.data.length > 0) {
          console.log(`Found ${profilesData.data.length} profiles:`);

          // List all profiles to check
          profilesData.data.forEach((profile, index) => {
            console.log(`${index + 1}. ${profile.user.uniqueId} (ID: ${profile.user.id})`);
          });

          // Check if our account is in the list
          const foundProfile = profilesData.data.find(profile =>
            profile.user && (
              profile.user.id === testUID ||
              profile.user.uniqueId === data.data.data.user.uniqueId
            )
          );

          if (foundProfile) {
            console.log(`%c✅ Account "${data.data.data.user.uniqueId}" found in profiles!`, 'color: green; font-weight: bold');
          } else {
            console.log(`%c❌ Account "${data.data.data.user.uniqueId}" NOT found in profiles!`, 'color: red; font-weight: bold');
            console.log('This suggests the account API call succeeded but database storage failed');
          }
        } else {
          console.log('%c❌ Failed to get profiles list', 'color: red');
        }
      }, 2000); // Wait 2 seconds before checking profiles
    } else {
      console.log('%c❌ API call failed:', 'color: red; font-weight: bold', data.error);
    }
  } catch (error) {
    console.error('Error during test:', error);
  }
})(); 