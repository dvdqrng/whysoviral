import { NextResponse } from 'next/server'
import { supabase } from '@/lib/db/supabase'
import { setupRefreshTrackingSQL } from '@/lib/db/queries'
import { calculateUserAnalytics } from '@/lib/analytics-service'

export const dynamic = "force-dynamic"

// Helper function to ensure app_status table exists
async function ensureAppStatusTable() {
  try {
    // Check if table exists
    const { error } = await supabase
      .from('app_status')
      .select('id')
      .limit(1);

    if (error && error.code === '42P01') {
      console.log('app_status table does not exist, attempting to create it');

      // Try to create via RPC
      const { error: rpcError } = await supabase.rpc('setup_refresh_tracking');

      if (rpcError) {
        console.log('Failed to create app_status table via RPC');
        return false;
      }

      return true;
    }

    return !error;
  } catch (err) {
    console.error('Error ensuring app_status table exists:', err);
    return false;
  }
}

// Get the last refresh time
async function getLastRefreshTime() {
  try {
    const { data, error } = await supabase
      .from('app_status')
      .select('last_refresh_time')
      .eq('id', 1)
      .single();

    if (error) {
      console.error('Error getting last refresh time:', error);
      return null;
    }

    return data?.last_refresh_time;
  } catch (error) {
    console.error('Error getting last refresh time:', error);
    return null;
  }
}

// Check if a refresh is needed (more than 1 hour since last refresh)
async function isRefreshNeeded() {
  const lastRefreshTime = await getLastRefreshTime();

  if (!lastRefreshTime) {
    return true;
  }

  const now = new Date();
  const lastRefresh = new Date(lastRefreshTime);
  const hoursSinceLastRefresh = (now.getTime() - lastRefresh.getTime()) / (1000 * 60 * 60);

  return hoursSinceLastRefresh > 1;
}

// Update the last refresh time
async function updateRefreshTime(dataChanged: boolean) {
  try {
    const now = new Date().toISOString();

    // Ensure the app_status table exists
    const tableExists = await ensureAppStatusTable();

    if (!tableExists) {
      console.error('app_status table does not exist and could not be created');
      return false;
    }

    const { error } = await supabase
      .from('app_status')
      .upsert({
        id: 1,
        last_refresh_time: now,
        refresh_count: supabase.rpc('increment_refresh_count', { row_id: 1 }),
        data_changed: dataChanged
      });

    if (error) {
      console.error('Error updating refresh time:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating refresh time:', error);
    console.log('Using in-memory fallback for refresh time');
    return false;
  }
}

// GET endpoint to check last refresh time and if refresh is needed
export async function GET() {
  try {
    // Ensure the app_status table exists
    await ensureAppStatusTable();

    // The last refresh time might be null if the database operations fail
    const lastRefreshTime = await getLastRefreshTime()
    const needsRefresh = await isRefreshNeeded()

    // Return response even if the last refresh time is null
    return NextResponse.json({
      success: true,
      lastRefreshTime,
      needsRefresh
    })
  } catch (error) {
    console.error('Error checking refresh status:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to check refresh status'
    }, { status: 500 })
  }
}

// POST endpoint to trigger a refresh of all accounts
export async function POST() {
  try {
    console.log('Refreshing all TikTok accounts...')

    // Get all accounts
    const { data: accounts, error } = await supabase
      .from('tiktok_accounts')
      .select('user_id, username');

    if (error) {
      console.error('Error fetching accounts for refresh:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch accounts',
      }, { status: 500 });
    }

    console.log(`Found ${accounts.length} accounts to refresh`);

    // Use the centralized analytics service to recalculate analytics for each account
    let totalUpdated = 0;
    let anyDataChanged = false;

    for (const account of accounts) {
      try {
        // Recalculate analytics using the analytics service
        const analytics = await calculateUserAnalytics(account.username);

        if (analytics) {
          totalUpdated++;
          anyDataChanged = true;
          console.log(`Successfully refreshed analytics for ${account.username}`);
        }
      } catch (accountError) {
        console.error(`Error processing account ${account.username}:`, accountError);
      }
    }

    // Update the refresh time
    await updateRefreshTime(anyDataChanged);

    // Get the updated last refresh time after the refresh operation
    const lastRefreshTime = await getLastRefreshTime()

    return NextResponse.json({
      success: true,
      message: `Refreshed ${totalUpdated} accounts`,
      refreshedCount: totalUpdated,
      dataChanged: anyDataChanged,
      lastRefreshTime: lastRefreshTime || new Date().toISOString() // Fallback to current time if DB failed
    })
  } catch (error) {
    console.error('Error refreshing accounts:', error)

    // Check if the error is related to rate limiting
    const errorStr = String(error)
    const isRateLimit = errorStr.includes('Too Many Requests') ||
      errorStr.includes('rate limit') ||
      errorStr.includes('429')

    // Even in case of an error, we'll try to provide a meaningful response
    return NextResponse.json({
      success: false,
      error: isRateLimit ? 'TikTok API rate limit exceeded' : 'An unexpected error occurred',
      details: typeof error === 'object' ? JSON.stringify(error) : String(error),
      rateLimited: isRateLimit,
      dataChanged: false,
      lastRefreshTime: new Date().toISOString() // Use current time as fallback
    }, { status: isRateLimit ? 429 : 500 })
  }
} 