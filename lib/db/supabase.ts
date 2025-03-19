import { createClient } from '@supabase/supabase-js'
import { TikTokAccount, TikTokPost, RefreshStatus } from './models'

// TypeScript interfaces for our database models
interface DatabaseError extends Error {
  code?: string
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  throw new Error('Missing Supabase environment variables')
}

console.log('Initializing Supabase client with URL:', supabaseUrl)
export const supabase = createClient(supabaseUrl, supabaseKey)

// Test the connection
async function testConnection() {
  try {
    const { error } = await supabase
      .from('tiktok_accounts')
      .select('count')
      .limit(1)

    if (error) {
      console.error('Supabase connection test failed:', error)
    } else {
      console.log('Supabase connection test successful')
    }
  } catch (error) {
    console.error('Error during Supabase connection test:', error)
  }
}

// Run the test when the module loads
testConnection()

export async function upsertTikTokUser(userData: Partial<TikTokAccount>, searchedByUid?: string, authUserId?: string): Promise<TikTokAccount | null> {
  try {
    console.log('=== Upserting TikTok User ===')
    console.log('Raw user data:', JSON.stringify(userData, null, 2))
    console.log('Searched by UID:', searchedByUid)
    console.log('Auth User ID:', authUserId)

    // Validate required fields
    if (!userData.user_id || !userData.username) {
      console.error('Missing required fields:', { user_id: userData.user_id, username: userData.username })
      throw new Error('Missing required fields for TikTok user')
    }

    // Transform numeric fields
    const transformedData = {
      ...userData,
      followers: userData.followers ? parseInt(String(userData.followers).replace(/,/g, '')) : 0,
      following: userData.following ? parseInt(String(userData.following).replace(/,/g, '')) : 0,
      likes: userData.likes ? parseInt(String(userData.likes).replace(/,/g, '')) : 0,
      videos: userData.videos ? parseInt(String(userData.videos).replace(/,/g, '')) : 0,
    }

    console.log('Transformed user data:', JSON.stringify(transformedData, null, 2))

    const { data, error } = await supabase
      .from('tiktok_accounts')
      .upsert({
        user_id: transformedData.user_id,
        username: transformedData.username,
        nickname: transformedData.nickname,
        followers: transformedData.followers,
        following: transformedData.following,
        likes: transformedData.likes,
        videos: transformedData.videos,
        verified: transformedData.verified,
        bio: transformedData.bio,
        avatar: transformedData.avatar,
        profile_url: transformedData.profile_url,
        last_updated: new Date().toISOString(),
        // Include the authenticated user's ID if provided
        ...(authUserId && { auth_user_id: authUserId })
      })
      .select()
      .single()

    if (error) {
      console.error('Database error during upsert:', error)
      throw error
    }

    // The tiktok_user_searches table no longer exists, so we've removed the tracking code
    // that was previously here

    console.log('Successfully upserted user:', JSON.stringify(data, null, 2))
    return data
  } catch (error) {
    console.error('Error upserting TikTok user:', error)
    throw error
  }
}

export async function upsertTikTokPosts(posts: any[], username: string): Promise<TikTokPost[]> {
  try {
    console.log('\n=== Upserting TikTok Posts ===')
    console.log('Number of posts to upsert:', posts.length)
    console.log('Username:', username)
    console.log('First post raw data:', JSON.stringify(posts[0], null, 2))

    const formattedPosts = posts.map((post, index) => {
      try {
        console.log(`\nFormatting post ${index + 1}/${posts.length}:`)
        console.log('Input post data:', JSON.stringify(post, null, 2))

        const formatted = {
          id: post.id,
          username: username,
          description: post.description || post.desc,
          created_at: post.created_at || post.createTime,
          plays: post.plays || post.playCount || 0,
          likes: post.likes || post.diggCount || 0,
          shares: post.shares || post.shareCount || 0,
          comments: post.comments || post.commentCount || 0,
          bookmarks: post.bookmarks || post.collectCount || 0,
          video_duration: post.video_duration || post.duration || 0,
          video_ratio: post.video_ratio || post.ratio,
          video_cover_url: post.video_cover_url || post.cover,
          video_play_url: post.video_play_url || post.play,
          music_title: post.music_title || (post.music?.title) || '',
          music_author: post.music_author || (post.music?.author) || '',
          music_is_original: post.music_is_original || (post.music?.original) || false,
          music_duration: post.music_duration || (post.music?.duration) || 0,
          music_play_url: post.music_play_url || (post.music?.play) || '',
          is_pinned: post.is_pinned || post.is_top || false,
          is_ad: post.is_ad || false,
          region: post.region || '',
          hashtags: Array.isArray(post.hashtags) ? post.hashtags : [],
          mentions: Array.isArray(post.mentions) ? post.mentions : [],
          last_updated: new Date().toISOString()
        }

        console.log('Formatted post data:', JSON.stringify(formatted, null, 2))

        // Validate required fields
        if (!formatted.id || !formatted.username) {
          console.error(`Missing required fields in post ${index}:`, { id: formatted.id, username: formatted.username })
          throw new Error(`Missing required fields for post ${index}`)
        }

        return formatted
      } catch (err) {
        console.error(`Error formatting post ${index}:`, err)
        console.error('Problematic post data:', JSON.stringify(post, null, 2))
        throw err
      }
    })

    console.log('\nAttempting to upsert posts to Supabase...')
    console.log('Number of formatted posts:', formattedPosts.length)
    console.log('First formatted post:', JSON.stringify(formattedPosts[0], null, 2))

    const { data, error } = await supabase
      .from('tiktok_posts')
      .upsert(formattedPosts)
      .select()

    if (error) {
      console.error('Database error during posts upsert:', error)
      throw error
    }

    console.log('Successfully upserted posts:', data?.length)
    if (data && data.length > 0) {
      console.log('First upserted post:', JSON.stringify(data[0], null, 2))
    }

    return data || []
  } catch (error) {
    console.error('Error upserting TikTok posts:', error)
    throw error
  }
}

export async function getTikTokUserFromDB(identifier: string, by: 'username' | 'user_id' = 'username'): Promise<TikTokAccount | null> {
  try {
    console.log(`=== Fetching TikTok User by ${by} ===`)
    console.log('Identifier:', identifier)

    const { data, error } = await supabase
      .from('tiktok_accounts')
      .select('*')
      .eq(by, identifier)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('User not found in database')
        return null
      }
      console.error('Database error fetching user:', error)
      throw error
    }

    console.log('Found user:', JSON.stringify(data, null, 2))
    return data
  } catch (error) {
    console.error('Error fetching TikTok user:', error)
    throw error
  }
}

export async function getTikTokPostsFromDB(username: string): Promise<TikTokPost[]> {
  try {
    console.log('=== Fetching TikTok Posts ===')
    console.log('Username:', username)

    const { data, error } = await supabase
      .from('tiktok_posts')
      .select('*')
      .eq('username', username)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error fetching posts:', error)
      throw error
    }

    console.log('Found posts:', data?.length)
    console.log('First post:', data?.[0] ? JSON.stringify(data[0], null, 2) : 'No posts found')
    return data || []
  } catch (error) {
    console.error('Error fetching TikTok posts:', error)
    throw error
  }
}

export async function shouldRefreshData(identifier: string, by: 'username' | 'user_id' = 'username', refreshThresholdHours: number = 1): Promise<boolean> {
  console.log('=== Checking Data Freshness ===')
  console.log(`Identifier: ${identifier}, Type: ${by}, Threshold: ${refreshThresholdHours}h`)

  const user = await getTikTokUserFromDB(identifier, by)
  if (!user) {
    console.log('No existing data found, refresh needed')
    return true
  }

  const lastUpdated = new Date(user.last_updated)
  const now = new Date()
  const hoursSinceLastUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60)

  console.log(`Last updated: ${lastUpdated.toISOString()}`)
  console.log(`Hours since last update: ${hoursSinceLastUpdate}`)
  console.log(`Refresh needed: ${hoursSinceLastUpdate > refreshThresholdHours}`)

  return hoursSinceLastUpdate > refreshThresholdHours
}

// Note: The trackUserSearch function has been removed as the tiktok_user_searches table
// no longer exists in the database 

// In-memory fallback for refresh time if database fails
// NOTE: This variable is not synchronized across server instances
// and should only be used as a last resort fallback
let inMemoryLastRefreshTime: string | null = null;

// Get the last time data was refreshed
export async function getLastRefreshTime(): Promise<string | null> {
  try {
    // First, check if the app_status table exists
    const createTable = await supabase
      .from('app_status')
      .select('id')
      .limit(1);

    // If the table doesn't exist or has an error, try to create it
    if (createTable.error && createTable.error.code === '42P01') { // Table doesn't exist
      console.log('app_status table does not exist, attempting to create it');

      // Try to create the table with direct SQL
      const { error: createError } = await supabase.rpc('create_app_status_table');

      // If the RPC fails, try direct SQL
      if (createError) {
        console.log('Failed to create app_status table via RPC, trying direct SQL');
        const { error: sqlError } = await supabase.rpc('setup_refresh_tracking');

        // If both fail, use in-memory fallback
        if (sqlError) {
          console.log('Failed to create app_status table via SQL, using in-memory fallback');
          return inMemoryLastRefreshTime;
        }
      }
    }

    // At this point the table should exist, so try to get the data
    const { data, error } = await supabase
      .from('app_status')
      .select('last_refresh_time')
      .eq('id', 1)
      .single();

    if (error) {
      console.error('Error fetching last refresh time:', error);
      // Return in-memory value as fallback
      return inMemoryLastRefreshTime;
    }

    // Update in-memory cache if successful
    if (data) {
      inMemoryLastRefreshTime = data.last_refresh_time;
    }

    return data?.last_refresh_time || inMemoryLastRefreshTime;
  } catch (error) {
    console.error('Error getting last refresh time:', error);
    return inMemoryLastRefreshTime; // Return in-memory value as fallback
  }
}

// Update the refresh time to now
// Only updates if dataChanged is true to prevent marking as refreshed when no actual data changed
export async function updateRefreshTime(dataChanged: boolean = false): Promise<boolean> {
  // Skip updating refresh time if no data was actually changed
  if (!dataChanged) {
    console.log('No data changed, skipping refresh time update');
    return false;
  }

  try {
    const now = new Date().toISOString();

    // Always update the in-memory cache
    inMemoryLastRefreshTime = now;

    // Try to check if table exists
    const checkTable = await supabase
      .from('app_status')
      .select('id')
      .limit(1);

    // If table doesn't exist, try to create it
    if (checkTable.error && checkTable.error.code === '42P01') {
      console.log('app_status table does not exist, attempting to create it');

      // Try to create the table with direct SQL
      const { error: createError } = await supabase.rpc('create_app_status_table');

      // If the RPC fails, try direct SQL
      if (createError) {
        console.log('Failed to create app_status table via RPC, trying direct SQL');
        const { error: sqlError } = await supabase.rpc('setup_refresh_tracking');

        // If both fail, use in-memory fallback
        if (sqlError) {
          console.log('Failed to create app_status table via SQL, using in-memory fallback');
          return false;
        }
      }
    }

    // If we got here, the table should exist or was created, so update the record
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
      console.error('Error updating refresh time:', error);
      console.log('Using in-memory fallback for refresh time');
      return false;
    }

    console.log('Successfully updated refresh time in database');
    return true;
  } catch (error) {
    console.error('Error updating refresh time:', error);
    console.log('Using in-memory fallback for refresh time');
    return false;
  }
}

// Refresh all TikTok accounts data
export async function refreshAllAccounts(): Promise<{
  success: boolean,
  refreshedCount: number,
  rateLimited?: boolean,
  dataChanged: boolean // Track if actual data was updated
}> {
  try {
    // Get all accounts
    const { data: accounts, error } = await supabase
      .from('tiktok_accounts')
      .select('user_id, username');

    if (error) {
      console.error('Error fetching accounts for refresh:', error);
      return { success: false, refreshedCount: 0, dataChanged: false };
    }

    console.log(`Found ${accounts.length} accounts to refresh`);

    // Rather than calling the TikTok API directly which might have rate limits,
    // we'll recalculate analytics from the data we already have
    let totalUpdated = 0;
    let anyDataChanged = false;

    for (const account of accounts) {
      try {
        // Get all posts for this account
        const { data: posts, error: postsError } = await supabase
          .from('tiktok_posts')
          .select('*')
          .eq('username', account.username);

        if (postsError) {
          console.error(`Error fetching posts for ${account.username}:`, postsError);
          continue;
        }

        if (!posts || posts.length === 0) {
          console.log(`No posts found for ${account.username}, skipping analytics calculation`);
          continue;
        }

        // Calculate analytics
        const analytics = calculateAnalyticsFromPosts(posts, account.username);

        // Store analytics in the database
        try {
          const { data: existingAnalytics } = await supabase
            .from('tiktok_analytics')
            .select('id')
            .eq('username', account.username)
            .single();

          if (existingAnalytics) {
            // Update existing analytics
            const { error: updateError } = await supabase
              .from('tiktok_analytics')
              .update(analytics)
              .eq('username', account.username);

            if (updateError) {
              console.error(`Error updating analytics for ${account.username}:`, updateError);
            } else {
              totalUpdated++;
              anyDataChanged = true;
            }
          } else {
            // Insert new analytics
            const { error: insertError } = await supabase
              .from('tiktok_analytics')
              .insert({ ...analytics, username: account.username });

            if (insertError) {
              console.error(`Error inserting analytics for ${account.username}:`, insertError);
            } else {
              totalUpdated++;
              anyDataChanged = true;
            }
          }
        } catch (analyticsError) {
          console.error(`Error handling analytics for ${account.username}:`, analyticsError);
        }

        console.log(`Processed analytics for ${account.username}`);
      } catch (accountError) {
        console.error(`Error processing account ${account.username}:`, accountError);
      }
    }

    // Update the refresh time
    await updateRefreshTime(anyDataChanged);

    return {
      success: true,
      refreshedCount: totalUpdated,
      dataChanged: anyDataChanged
    };
  } catch (error) {
    console.error('Error in refreshAllAccounts:', error);
    return {
      success: false,
      refreshedCount: 0,
      dataChanged: false
    };
  }
}

// Helper function to calculate analytics from posts
function calculateAnalyticsFromPosts(posts: any[], username: string) {
  // Base analytics object
  const analytics = {
    username,
    total_posts: posts.length,
    total_likes: 0,
    total_comments: 0,
    total_shares: 0,
    total_views: 0,
    avg_likes_per_post: 0,
    avg_comments_per_post: 0,
    avg_shares_per_post: 0,
    avg_views_per_post: 0,
    avg_engagement_rate: 0,
    weekly_post_frequency: [],
    post_frequency: { weekly: 0, monthly: 0 },
    last_calculated: new Date().toISOString()
  };

  // Calculate total metrics
  posts.forEach(post => {
    analytics.total_likes += post.likes || 0;
    analytics.total_comments += post.comments || 0;
    analytics.total_shares += post.shares || 0;
    analytics.total_views += post.plays || 0;
  });

  // Calculate averages
  if (posts.length > 0) {
    analytics.avg_likes_per_post = analytics.total_likes / posts.length;
    analytics.avg_comments_per_post = analytics.total_comments / posts.length;
    analytics.avg_shares_per_post = analytics.total_shares / posts.length;
    analytics.avg_views_per_post = analytics.total_views / posts.length;

    // Calculate engagement rate
    if (analytics.total_views > 0) {
      const totalEngagements = analytics.total_likes + analytics.total_comments + analytics.total_shares;
      analytics.avg_engagement_rate = (totalEngagements / analytics.total_views) * 100;
    }
  }

  // Calculate post frequency
  try {
    const validDates = posts
      .map(post => {
        try {
          const date = new Date(post.created_at);
          return !isNaN(date.getTime()) ? date : null;
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean);

    if (validDates.length > 1) {
      // Sort dates from oldest to newest
      validDates.sort((a, b) => a.getTime() - b.getTime());

      const firstPost = validDates[0];
      const lastPost = validDates[validDates.length - 1];
      const totalDays = (lastPost.getTime() - firstPost.getTime()) / (1000 * 60 * 60 * 24);

      if (totalDays > 0) {
        analytics.post_frequency.weekly = (validDates.length / totalDays) * 7;
        analytics.post_frequency.monthly = (validDates.length / totalDays) * 30;
      }
    }
  } catch (dateError) {
    console.error(`Error calculating post frequency for ${username}:`, dateError);
  }

  return analytics;
}