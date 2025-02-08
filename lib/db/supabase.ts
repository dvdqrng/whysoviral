import { createClient } from '@supabase/supabase-js'

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
    const { data, error } = await supabase
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

export async function upsertTikTokUser(userData: any) {
  const { data, error } = await supabase
    .from('tiktok_users')
    .upsert({
      username: userData.username,
      nickname: userData.nickname,
      followers: parseInt(userData.followers.replace(/,/g, '')),
      following: parseInt(userData.following.replace(/,/g, '')),
      likes: parseInt(userData.likes.replace(/,/g, '')),
      videos: parseInt(userData.videos.replace(/,/g, '')),
      verified: userData.verified,
      bio: userData.bio,
      category: userData.category,
      avatar: userData.avatar,
      last_updated: new Date().toISOString()
    })
    .select()

  if (error) throw error
  return data
}

export async function upsertTikTokPosts(posts: any[], username: string) {
  const formattedPosts = posts.map(post => ({
    id: post.id,
    username: username,
    description: post.desc,
    created_at: post.createTime,
    plays: post.stats.plays,
    likes: post.stats.likes,
    shares: post.stats.shares,
    comments: post.stats.comments,
    bookmarks: post.stats.bookmarks,
    video_duration: post.video.duration,
    video_ratio: post.video.ratio,
    video_cover_url: post.video.coverUrl,
    video_play_url: post.video.playUrl,
    music_title: post.music.title,
    music_author: post.music.author,
    music_is_original: post.music.isOriginal,
    last_updated: new Date().toISOString()
  }))

  const { data, error } = await supabase
    .from('tiktok_posts')
    .upsert(formattedPosts)
    .select()

  if (error) throw error
  return data
}

export async function getTikTokUserFromDB(username: string) {
  const { data, error } = await supabase
    .from('tiktok_users')
    .select('*')
    .eq('username', username)
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 is "not found"
  return data
}

export async function getTikTokPostsFromDB(username: string) {
  const { data, error } = await supabase
    .from('tiktok_posts')
    .select('*')
    .eq('username', username)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function shouldRefreshData(username: string, refreshThresholdHours: number = 1) {
  const user = await getTikTokUserFromDB(username)
  if (!user) return true

  const lastUpdated = new Date(user.last_updated)
  const now = new Date()
  const hoursSinceLastUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60)

  return hoursSinceLastUpdate > refreshThresholdHours
} 