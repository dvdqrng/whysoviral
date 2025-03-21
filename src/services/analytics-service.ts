import { supabase } from './db/supabase'

export interface PostAnalytics {
  avgViewsPerPost: number
  avgTimeBetweenPosts: number // in hours
  avgEngagementRate: number // as percentage
  weeklyPostFrequency: { week: string; count: number }[]
  viewsTrend: { date: string; views: number }[]
  postFrequency: { weekly: number; monthly: number }
  topHashtags: string[]
  totalLikes: number
  totalComments: number
  totalShares: number
  totalViews: number
  lastCalculated: string
}

// Get analytics for a specific user
export async function getProfileAnalytics(username: string, timeframe: number = 12, auth_user_id?: string, tiktok_uid?: string): Promise<PostAnalytics | null> {
  try {
    console.log(`===== DEBUG: getProfileAnalytics =====`)
    console.log(`Parameters received:`)
    console.log(`- username: ${username}`)
    console.log(`- timeframe: ${timeframe}`)
    console.log(`- auth_user_id: ${auth_user_id || 'not provided'}`)
    console.log(`- tiktok_uid: ${tiktok_uid || 'not provided'}`)

    // Import the supabaseAdmin client to bypass RLS
    const { supabaseAdmin } = await import('./db/supabase-admin')

    if (!supabaseAdmin) {
      console.error('Admin client not available, falling back to regular client')
    }

    // Use supabaseAdmin if available, otherwise fall back to regular client
    const client = supabaseAdmin || supabase
    console.log(`Using ${supabaseAdmin ? 'admin' : 'regular'} client for database queries`)

    // Build the base query
    let query = client.from('tiktok_accounts').select('*')

    // Log the actual query that will be executed
    let queryDescription = ''

    // ALWAYS prioritize tiktok_uid when available
    if (tiktok_uid && tiktok_uid.length > 0) {
      console.log(`Using tiktok_uid for query: ${tiktok_uid}`)
      query = query.eq('tiktok_uid', tiktok_uid)
      queryDescription += `tiktok_uid = ${tiktok_uid}`
    } else {
      console.log(`Using username for query: ${username}`)
      query = query.eq('username', username)
      queryDescription += `username = ${username}`
    }

    // Add auth_user_id filter only if specifically querying for a user's accounts
    if (auth_user_id) {
      console.log(`Adding auth_user_id filter: ${auth_user_id}`)
      query = query.eq('auth_user_id', auth_user_id)
      queryDescription += ` AND auth_user_id = ${auth_user_id}`
    }

    console.log(`Final query: SELECT * FROM tiktok_accounts WHERE ${queryDescription} LIMIT 1`)

    // Execute the query - ALWAYS use limit(1) instead of single()
    const { data: users, error: userError } = await query.limit(1)

    // Direct database debug query for cross-checking
    console.log(`Running verification queries...`)

    // Check by tiktok_uid
    if (tiktok_uid) {
      const { data: byUid } = await supabase
        .from('tiktok_accounts')
        .select('*')
        .eq('tiktok_uid', tiktok_uid)
      console.log(`Query by tiktok_uid=${tiktok_uid} found ${byUid?.length || 0} accounts`)
    }

    // Check by username 
    const { data: byUsername } = await supabase
      .from('tiktok_accounts')
      .select('*')
      .eq('username', username)
    console.log(`Query by username=${username} found ${byUsername?.length || 0} accounts`)

    // Check by auth_user_id
    if (auth_user_id) {
      const { data: byAuth } = await supabase
        .from('tiktok_accounts')
        .select('*')
        .eq('auth_user_id', auth_user_id)
      console.log(`Query by auth_user_id=${auth_user_id} found ${byAuth?.length || 0} accounts`)
    }

    if (userError) {
      console.error(`Error getting user data:`, userError)
      return null
    }

    console.log(`QUERY RESULT: Found ${users?.length || 0} users`)
    if (users && users.length > 0) {
      console.log(`First result tiktok_uid: ${users[0].tiktok_uid}`)
      console.log(`First result username: ${users[0].username}`)
    }

    // Get the first user if available
    const user = users && users.length > 0 ? users[0] : null

    if (!user) {
      console.log(`User not found with query: ${queryDescription}`)
      return null
    } else {
      console.log(`Found user with tiktok_uid: ${user.tiktok_uid}`)
    }

    // Calculate the cutoff date based on the timeframe
    const cutoffDate = new Date()
    cutoffDate.setMonth(cutoffDate.getMonth() - timeframe)
    const cutoffDateStr = cutoffDate.toISOString()

    // For post queries, prioritize tiktok_uid over username when available
    let postQuery = client.from('tiktok_posts').select('*')
      .gte('created_at', cutoffDateStr) // Filter by timeframe
      .order('created_at', { ascending: true })

    if (user.tiktok_uid) {
      postQuery = postQuery.eq('tiktok_uid', user.tiktok_uid)
    } else {
      postQuery = postQuery.eq('username', user.username)
    }

    // Fetch all posts using pagination
    let allPosts: any[] = []
    let hasMore = true
    let page = 0
    const pageSize = 100 // Fetch 100 posts at a time

    while (hasMore) {
      const { data: posts, error } = await postQuery
        .range(page * pageSize, (page + 1) * pageSize - 1)

      if (error) {
        console.error(`Error fetching posts:`, error)
        hasMore = false
      } else if (!posts || posts.length === 0) {
        hasMore = false
      } else {
        allPosts = [...allPosts, ...posts]

        // If we got fewer posts than the page size, we've reached the end
        if (posts.length < pageSize) {
          hasMore = false
        } else {
          page++
        }
      }
    }

    console.log(`Retrieved ${allPosts.length} posts for account with ID ${user.tiktok_uid || 'unknown'} in the ${timeframe} month timeframe`)

    // If no posts in the timeframe, return empty analytics instead of using calculateUserAnalytics
    if (allPosts.length === 0) {
      console.log(`No posts found in the ${timeframe} month timeframe for account with ID ${user.tiktok_uid || 'unknown'}`)

      // Return empty analytics structure instead of falling back to username-based lookup
      return {
        avgViewsPerPost: 0,
        avgTimeBetweenPosts: 0,
        avgEngagementRate: 0,
        weeklyPostFrequency: [],
        viewsTrend: [],
        postFrequency: { weekly: 0, monthly: 0 },
        topHashtags: [],
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        totalViews: 0,
        lastCalculated: new Date().toISOString()
      }
    }

    // Calculate analytics for the timeframe
    return {
      avgViewsPerPost: calculateAverageViewsPerPost(allPosts),
      avgTimeBetweenPosts: calculateAverageTimeBetweenPosts(allPosts),
      avgEngagementRate: calculateEngagementRate(allPosts),
      weeklyPostFrequency: calculateWeeklyPostFrequency(allPosts),
      viewsTrend: calculateViewsTrend(allPosts),
      postFrequency: calculatePostFrequency(allPosts),
      topHashtags: extractTopHashtags(allPosts),
      totalLikes: calculateTotalMetric(allPosts, 'likes'),
      totalComments: calculateTotalMetric(allPosts, 'comments'),
      totalShares: calculateTotalMetric(allPosts, 'shares'),
      totalViews: calculateTotalMetric(allPosts, 'plays'),
      lastCalculated: new Date().toISOString()
    }
  } catch (error) {
    console.error(`Error in getProfileAnalytics for account with ID ${tiktok_uid || username}:`, error)
    return null
  }
}

// Helper function to calculate average views per post
function calculateAverageViewsPerPost(posts: any[]): number {
  if (posts.length === 0) return 0
  const totalViews = posts.reduce((sum, post) => sum + (post.plays || 0), 0)
  return Math.round(totalViews / posts.length)
}

// Helper function to calculate average time between posts
function calculateAverageTimeBetweenPosts(posts: any[]): number {
  if (posts.length <= 1) return 0

  const sortedPosts = [...posts].sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  let totalTimeBetween = 0
  for (let i = 1; i < sortedPosts.length; i++) {
    const timeDiff = new Date(sortedPosts[i].created_at).getTime() - new Date(sortedPosts[i - 1].created_at).getTime()
    totalTimeBetween += timeDiff
  }

  return (totalTimeBetween / (posts.length - 1)) / (1000 * 60 * 60) // Convert to hours
}

// Helper function to calculate weekly post frequency
function calculateWeeklyPostFrequency(posts: any[]): { week: string; count: number }[] {
  if (posts.length === 0) return []

  // Group posts by week
  const postsByWeek: Record<string, number> = {}

  posts.forEach(post => {
    const date = new Date(post.created_at)
    const weekStart = new Date(date)
    // Adjust to the start of the week (Sunday)
    weekStart.setDate(date.getDate() - date.getDay())
    const weekKey = weekStart.toISOString().split('T')[0]

    postsByWeek[weekKey] = (postsByWeek[weekKey] || 0) + 1
  })

  // Convert to array format
  return Object.entries(postsByWeek)
    .map(([week, count]) => ({ week, count }))
    .sort((a, b) => a.week.localeCompare(b.week))
}

// Helper function to calculate views trend
function calculateViewsTrend(posts: any[]): { date: string; views: number }[] {
  if (posts.length === 0) return []

  // Group views by day
  const viewsByDay: Record<string, number> = {}

  posts.forEach(post => {
    const date = new Date(post.created_at).toISOString().split('T')[0]
    viewsByDay[date] = (viewsByDay[date] || 0) + (post.plays || 0)
  })

  // Convert to array format
  return Object.entries(viewsByDay)
    .map(([date, views]) => ({ date, views }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

// Helper functions for calculating specific metrics
function calculateEngagementRate(posts: any[]): number {
  if (posts.length === 0) return 0

  let totalEngagementRate = 0
  let totalViews = 0

  posts.forEach(post => {
    const plays = post.plays || 0
    totalViews += plays

    if (plays > 0) {
      const engagement = (post.likes || 0) + (post.comments || 0) + (post.shares || 0)
      totalEngagementRate += (engagement / plays) * 100
    }
  })

  return posts.length > 0 ? totalEngagementRate / posts.length : 0
}

function calculatePostFrequency(posts: any[]): { weekly: number; monthly: number } {
  const result = { weekly: 0, monthly: 0 }

  if (posts.length < 2) return result

  try {
    const postDates = posts
      .map(post => {
        try {
          const date = new Date(post.created_at)
          return !isNaN(date.getTime()) ? date : null
        } catch (e) {
          return null
        }
      })
      .filter(Boolean) as Date[]

    if (postDates.length > 1) {
      // Sort dates from oldest to newest
      postDates.sort((a, b) => a.getTime() - b.getTime())

      // Calculate average posts per week/month
      const firstPost = postDates[0]
      const lastPost = postDates[postDates.length - 1]
      const totalDays = (lastPost.getTime() - firstPost.getTime()) / (1000 * 60 * 60 * 24)

      if (totalDays > 0) {
        result.weekly = (postDates.length / totalDays) * 7
        result.monthly = (postDates.length / totalDays) * 30
      }
    }
  } catch (error) {
    console.error('Error calculating post frequency:', error)
  }

  return result
}

function extractTopHashtags(posts: any[]): string[] {
  // Get all hashtags and count their occurrences
  const hashtagCounts: Record<string, number> = {}

  posts.forEach(post => {
    const hashtags = Array.isArray(post.hashtags) ? post.hashtags : []
    hashtags.forEach(tag => {
      if (typeof tag === 'string') {
        hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1
      }
    })
  })

  // Sort by frequency and return top 5
  return Object.entries(hashtagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag)
}

function calculateTotalMetric(posts: any[], field: string): number {
  return posts.reduce((sum, post) => sum + (post[field] || 0), 0)
}

export async function calculateUserAnalytics(username: string, timeframe: number = 12, tiktok_uid?: string): Promise<PostAnalytics> {
  // Calculate the cutoff date based on the timeframe
  const cutoffDate = new Date()
  cutoffDate.setMonth(cutoffDate.getMonth() - timeframe)
  const cutoffDateStr = cutoffDate.toISOString()

  // Import the supabaseAdmin client to bypass RLS
  const { supabaseAdmin } = await import('./db/supabase-admin')

  if (!supabaseAdmin) {
    console.error('Admin client not available, falling back to regular client')
  }

  // Use supabaseAdmin if available, otherwise fall back to regular client
  const client = supabaseAdmin || supabase
  console.log(`Using ${supabaseAdmin ? 'admin' : 'regular'} client for analytics calculation`)

  // Fetch all posts using pagination
  let allPosts: any[] = []
  let hasMore = true
  let page = 0
  const pageSize = 100 // Fetch 100 posts at a time

  try {
    // First, try to get the user to get their tiktok_uid if not provided
    if (!tiktok_uid) {
      const { data: users, error } = await client
        .from('tiktok_accounts')
        .select('*')
        .eq('username', username)
        .limit(1)

      if (!error && users && users.length > 0) {
        tiktok_uid = users[0].tiktok_uid
      }
    }

    // Build query based on tiktok_uid (preferred) or username
    let query = client
      .from('tiktok_posts')
      .select('*')
      .gte('created_at', cutoffDateStr) // Filter by timeframe
      .order('created_at', { ascending: true })

    if (tiktok_uid) {
      query = query.eq('tiktok_uid', tiktok_uid)
    } else {
      query = query.eq('username', username)
    }

    while (hasMore) {
      const { data: posts, error } = await query
        .range(page * pageSize, (page + 1) * pageSize - 1)

      if (error) {
        console.error(`Error fetching posts for account ${tiktok_uid || username}:`, error)
        hasMore = false
      } else if (!posts || posts.length === 0) {
        hasMore = false
      } else {
        allPosts = [...allPosts, ...posts]

        // If we got fewer posts than the page size, we've reached the end
        if (posts.length < pageSize) {
          hasMore = false
        } else {
          page++
        }
      }
    }

    console.log(`Retrieved ${allPosts.length} posts for account ${tiktok_uid || username} in the ${timeframe} month timeframe`)
  } catch (error) {
    console.error(`Error in pagination for account ${tiktok_uid || username}:`, error)
    allPosts = []
  }

  // Return default values if no posts found instead of throwing an error
  if (allPosts.length === 0) {
    console.log(`No posts found for user: ${username} in the ${timeframe} month timeframe, returning default analytics`)

    // Return default values
    const defaultAnalytics: PostAnalytics = {
      avgViewsPerPost: 0,
      avgTimeBetweenPosts: 0,
      avgEngagementRate: 0,
      weeklyPostFrequency: [],
      viewsTrend: [],
      postFrequency: { weekly: 0, monthly: 0 },
      topHashtags: [],
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      totalViews: 0,
      lastCalculated: new Date().toISOString()
    }

    return defaultAnalytics
  }

  // Use the helper functions to calculate analytics
  return {
    avgViewsPerPost: calculateAverageViewsPerPost(allPosts),
    avgTimeBetweenPosts: calculateAverageTimeBetweenPosts(allPosts),
    avgEngagementRate: calculateEngagementRate(allPosts),
    weeklyPostFrequency: calculateWeeklyPostFrequency(allPosts),
    viewsTrend: calculateViewsTrend(allPosts),
    postFrequency: calculatePostFrequency(allPosts),
    topHashtags: extractTopHashtags(allPosts),
    totalLikes: calculateTotalMetric(allPosts, 'likes'),
    totalComments: calculateTotalMetric(allPosts, 'comments'),
    totalShares: calculateTotalMetric(allPosts, 'shares'),
    totalViews: calculateTotalMetric(allPosts, 'plays'),
    lastCalculated: new Date().toISOString()
  }
} 