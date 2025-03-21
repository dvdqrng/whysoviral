/**
 * Test script to diagnose TikTok account addition issues
 * 
 * This script helps identify why accounts may appear to add successfully in the UI
 * but are not being stored in the database.
 */

async function testAddAccount() {
  console.log('=== TikTok Account Addition Test ===');

  try {
    // Test account to add
    const testAccount = '@tiktok'; // Use a known account for testing

    console.log(`Testing account addition for: ${testAccount}`);

    // 1. Make the API call with credentials
    console.log('\n1. Making API call to add account...');
    const response = await fetch('/api/tiktok/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ profileUrl: testAccount }),
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

    // 2. Check if the account was added to the database
    console.log('\n2. Checking if account was added to database...');

    // Get the username from the API response
    const username = data.data?.data?.user?.uniqueId;

    if (!username) {
      console.error('❌ Could not extract username from API response');
      return;
    }

    console.log(`Extracted username: ${username}`);

    // Fetch profiles to check if the account appears
    console.log('\nFetching profiles list to check if account appears...');
    const profilesResponse = await fetch('/api/tiktok/profiles?userId=721af791-fdba-4c9f-b2c5-4e59d9e9207b', {
      credentials: 'include',
    });

    const profilesData = await profilesResponse.json();

    if (!profilesData.success) {
      console.error('❌ Failed to fetch profiles:', profilesData.error);
      return;
    }

    // Check if the added account is in the profiles list
    const accountFound = profilesData.data.some(profile =>
      profile.user.username === username ||
      profile.user.uniqueId === username
    );

    if (accountFound) {
      console.log(`✅ Account "${username}" found in profiles list!`);
    } else {
      console.error(`❌ Account "${username}" NOT found in profiles list!`);
      console.log('Profiles returned:', profilesData.data.map(p => p.user.username).join(', '));

      // Diagnosis: Check database schema issues
      console.log('\n3. Diagnosing potential database schema issues...');
      console.log('Common issues:');
      console.log('- Missing "user_id" column in tiktok_accounts table');
      console.log('- Missing "auth_user_id" column in tiktok_accounts table');
      console.log('- Table permissions issues');

      // Suggest solutions
      console.log('\nPotential solutions:');
      console.log('1. Check Supabase database schema');
      console.log('2. Fix column names to match code expectations');
      console.log('3. Update code to match database schema');
      console.log('4. Check database logs for detailed error messages');
    }
  } catch (error) {
    console.error('Error during testing:', error);
  }
}

// Execute the test
testAddAccount(); 