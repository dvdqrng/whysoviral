/**
 * Test script to diagnose TikTok account addition issues with a specific UID
 * 
 * This script helps identify database issues when adding a specific TikTok UID.
 */

async function testSpecificUIDAddition() {
  console.log('=== Testing Specific TikTok UID Addition ===');

  try {
    // Test with the specific UID provided
    const testUID = '6865486669187171334';

    console.log(`Testing account addition for UID: ${testUID}`);

    // 1. Make the API call with credentials
    console.log('\n1. Making API call to add account by UID...');
    const response = await fetch('/api/tiktok/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ profileUrl: testUID }),
      credentials: 'include',
    });

    // Log the response status
    console.log(`API Response Status: ${response.status}`);

    // Parse the JSON response
    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));

    if (!data.success) {
      console.error('❌ API call failed:', data.error);
      return;
    }

    console.log('✅ API call successful!');

    // 2. Extract user info from response for database checks
    const userInfo = data.data?.data?.user;
    console.log('\nExtracted user info:', JSON.stringify(userInfo, null, 2));

    // 3. Check database errors
    console.log('\n3. Checking for database errors in the API logs...');
    console.log('Look for errors related to:');
    console.log('- Column tiktok_accounts.user_id does not exist');
    console.log('- Could not find the user_id column of tiktok_accounts');

    // 4. Suggest database schema update
    console.log('\n4. Database Schema Update Required:');
    console.log('   The code expects a "user_id" column in the tiktok_accounts table,');
    console.log('   but your database schema has a different primary key column.');
    console.log('\n   Possible fixes:');
    console.log('   a) Add the user_id column to your tiktok_accounts table in Supabase:');
    console.log('      ALTER TABLE tiktok_accounts ADD COLUMN user_id TEXT PRIMARY KEY;');
    console.log('   b) OR update the code to use the existing primary key column:');
    console.log('      - Check your actual table schema in Supabase');
    console.log('      - Find what column is used instead of user_id (likely "id")');
    console.log('      - Modify the code to use that column name instead');

    // 5. Check the profiles list
    console.log('\n5. Checking if account appears in profiles list despite DB error...');
    const profilesResponse = await fetch('/api/tiktok/profiles?userId=721af791-fdba-4c9f-b2c5-4e59d9e9207b', {
      credentials: 'include',
    });

    const profilesData = await profilesResponse.json();
    console.log('Profiles API Response:', JSON.stringify(profilesData, null, 2));

    // Check profile data
    if (profilesData.success && profilesData.data) {
      console.log(`Found ${profilesData.data.length} profiles`);

      // Look for the specific UID in profiles
      const profileMatch = profilesData.data.find(profile =>
        profile.user && (
          profile.user.id === testUID ||
          profile.user.uniqueId === userInfo?.uniqueId
        )
      );

      if (profileMatch) {
        console.log('✅ Found the account in profiles despite database error!');
        console.log('Profile data:', JSON.stringify(profileMatch, null, 2));
      } else {
        console.log('❌ Account not found in profiles list');
      }
    } else {
      console.log('Failed to get profiles or no profiles returned');
    }
  } catch (error) {
    console.error('Error during testing:', error);
  }
}

// Execute the test
testSpecificUIDAddition(); 