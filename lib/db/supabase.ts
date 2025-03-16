import { createClient } from '@supabase/supabase-js'

// TypeScript interfaces for our database models
interface TikTokUser {
  user_id: string
  username: string
  nickname: string | null
  followers: number
  following: number
  likes: number
  videos: number
  verified: boolean
  bio: string | null
  avatar: string | null
  profile_url: string | null
  last_updated: string
}

interface TikTokPost {
  id: string
  username: string
  description: string | null
  created_at: string
  plays: number
  likes: number
  shares: number
  comments: number
  bookmarks: number
  video_duration: number
  video_ratio: string | null
  video_cover_url: string
  video_play_url: string
  music_title: string | null
  music_author: string | null
  music_is_original: boolean
  music_duration: number | null
  music_play_url: string | null
  is_pinned: boolean
  is_ad: boolean
  region: string | null
  hashtags: string[]
  mentions: string[]
  last_updated: string
}

interface DatabaseError extends Error {
  code?: string
}

// Use environment variables with fallback to local development values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54322'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

console.log('Initializing DB Supabase client with URL:', supabaseUrl)
export const dbSupabase = createClient(supabaseUrl, supabaseKey)

// For backwards compatibility
export const supabase = dbSupabase

// Test the connection
async function testConnection() {
  try {
    const { error } = await supabase
      .from('tiktok_users')
      .select('count')
      .limit(1)

    if (error) {
      console.error('Supabase connection test failed:', error)
      return false
    }

    console.log('Supabase connection test successful')
    return true
  } catch (error) {
    console.error('Supabase connection test error:', error)
    return false
  }
}

// Run the test when the module loads
testConnection()

export async function upsertTikTokUser(userData: Partial<TikTokUser>, searchedByUid?: string): Promise<TikTokUser | null> {
  try {
    console.log('=== Upserting TikTok User ===')
    console.log('Raw user data:', JSON.stringify(userData, null, 2))
    console.log('Searched by UID:', searchedByUid)

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
      .from('tiktok_users')
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
        last_updated: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Database error during upsert:', error)
      throw error
    }

    // If we have a searchedByUid, track the search in the tiktok_user_searches table
    if (searchedByUid && typeof searchedByUid === 'string' && data) {
      await trackUserSearch(data.user_id, searchedByUid)
    }

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

export async function getTikTokUserFromDB(identifier: string, by: 'username' | 'user_id' = 'username'): Promise<TikTokUser | null> {
  try {
    console.log(`=== Fetching TikTok User by ${by} ===`)
    console.log('Identifier:', identifier)

    const { data, error } = await supabase
      .from('tiktok_users')
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

export async function trackUserSearch(userId: string, searchedByUid: string) {
  try {
    console.log('=== Tracking User Search ===')
    console.log('User ID:', userId)
    console.log('Searched by UID:', searchedByUid)

    const { error } = await supabase
      .from('tiktok_user_searches')
      .insert({
        user_id: userId,
        searched_by_uid: searchedByUid
      })

    if (error) {
      // Check for "relation does not exist" error
      if (error.code === '42P01') {
        console.error('Error: The tiktok_user_searches table does not exist. Please ensure all migrations have been run.')
        // You may want to disable tracking silently in this case
        return
      }

      // Check for foreign key violation
      if (error.code === '23503') {
        console.error('Error: Referenced user_id does not exist in tiktok_users table')
        return
      }

      console.error('Error tracking user search:', {
        message: error.message,
        code: error.code,
        details: error.details
      })
      throw error
    }

    console.log('Successfully tracked user search')
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error tracking user search:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
    } else {
      console.error('Unknown error tracking user search:', error)
    }
    // Don't throw the error since this is a non-critical tracking function
    // Just log it and continue
  }
} 