// Script to clear the TikTok cache for a specific user ID
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// The specific UID we want to clear from cache
const TEST_UID = '6766559322627589000';

async function clearTikTokCache() {
  console.log('=== Clearing TikTok Cache ===');
  console.log('UID to clear:', TEST_UID);

  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Delete the user from tiktok_accounts table
    const { data: deleteData, error: deleteError } = await supabase
      .from('tiktok_accounts')
      .delete()
      .eq('user_id', TEST_UID);

    if (deleteError) {
      console.error('Error deleting from tiktok_accounts:', deleteError);
    } else {
      console.log('Successfully deleted from tiktok_accounts table');
    }

    console.log('Cache cleared for UID:', TEST_UID);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

// Run the function
clearTikTokCache(); 