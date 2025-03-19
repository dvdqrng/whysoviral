import { supabase } from './supabase'

// In-memory fallback for refresh time
let inMemoryLastRefreshTime: string | null = null;

// Function to directly setup the app_status table using raw SQL
export async function setupAppStatusTable(): Promise<boolean> {
  try {
    console.log('Setting up app_status table...')

    // Try to query the table to check if it exists
    const { data, error } = await supabase
      .from('app_status')
      .select('id')
      .limit(1);

    // If the table exists and we can query it, we're done
    if (!error) {
      console.log('app_status table already exists', data);
      return true;
    }

    // If the error is not a missing table error, something else is wrong
    if (error && error.code !== '42P01') {
      console.error('Unexpected error checking app_status table:', error);
      return false;
    }

    // If we reach here, table doesn't exist - use upsert with direct API calls
    console.log('Creating app_status table via direct API calls');

    // Try direct upsert to create record (this will fail if the table doesn't exist)
    const now = new Date().toISOString();
    const { error: upsertError } = await supabase
      .from('app_status')
      .upsert({
        id: 1,
        last_refresh_time: now,
        updated_at: now,
        created_at: now
      });

    if (upsertError) {
      console.error('Could not create app_status record:', upsertError);

      // Just update the in-memory variable as last resort
      console.log('Setting up in-memory fallback timestamp');
      inMemoryLastRefreshTime = now;
      return false;
    }

    console.log('app_status table setup completed');
    return true;
  } catch (error) {
    console.error('Unexpected error setting up app_status table:', error);
    return false;
  }
}

// Function to force update the refresh time to now
export async function forceUpdateRefreshTime(): Promise<boolean> {
  try {
    console.log('Forcing update of refresh time...');

    // First ensure the table exists
    await setupAppStatusTable();

    // Update the time
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('app_status')
      .upsert({
        id: 1,
        last_refresh_time: now,
        updated_at: now
      }, {
        onConflict: 'id'
      });

    if (error) {
      console.error('Error forcing update of refresh time:', error);

      // Update in-memory fallback
      inMemoryLastRefreshTime = now;
      console.log('Updated in-memory fallback timestamp to:', now);
      return false;
    }

    console.log('Refresh time updated to:', now);
    return true;
  } catch (error) {
    console.error('Unexpected error updating refresh time:', error);
    return false;
  }
}

// Function to get the in-memory timestamp for use by other modules
export function getInMemoryLastRefreshTime(): string | null {
  return inMemoryLastRefreshTime;
} 