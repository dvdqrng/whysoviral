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
export async function getProfileAnalytics(username: string, timeframe: number = 12): Promise<PostAnalytics | null> {
  try {
    console.log(`Getting analytics for ${username} with ${timeframe} month timeframe`)

    // First check if analytics are fresh in the tiktok_accounts table
    const { data: user, error: userError } = await supabase
      .from('tiktok_accounts')
      .select('*')
      .eq('username', username)
      .single()

    if (userError) {
      console.error(`Error getting user data for ${username}:`, userError)
      return null
    }

    if (!user) {
      console.log(`User ${username} not found`)
      return null
    }

    // Calculate the cutoff date based on the timeframe
    const cutoffDate = new Date()
    cutoffDate.setMonth(cutoffDate.getMonth() - timeframe)
    const cutoffDateStr = cutoffDate.toISOString()

    // Fetch all posts using pagination
    let allPosts: any[] = []
    let hasMore = true
    let page = 0
    const pageSize = 100 // Fetch 100 posts at a time

    while (hasMore) {
      const { data: posts, error } = await supabase
        .from('tiktok_posts')
        .select('*')
        .eq('username', username)
        .gte('created_at', cutoffDateStr) // Filter by timeframe
        .order('created_at', { ascending: true })
        .range(page * pageSize, (page + 1) * pageSize - 1)

      if (error) {
        console.error(`Error fetching posts for ${username}:`, error)
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

    console.log(`Retrieved ${allPosts.length} posts for ${username} in the ${timeframe} month timeframe`)

    // If no posts in the timeframe, use the regular analytics calculations
    if (allPosts.length === 0) {
      console.log(`No posts found in the ${timeframe} month timeframe for ${username}`)
      return await calculateUserAnalytics(username, timeframe)
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
    console.error(`Error in getProfileAnalytics for ${username}:`, error)
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

export async function calculateUserAnalytics(username: string, timeframe: number = 12): Promise<PostAnalytics> {
  // Calculate the cutoff date based on the timeframe
  const cutoffDate = new Date()
  cutoffDate.setMonth(cutoffDate.getMonth() - timeframe)
  const cutoffDateStr = cutoffDate.toISOString()

  // Fetch all posts using pagination
  let allPosts: any[] = []
  let hasMore = true
  let page = 0
  const pageSize = 100 // Fetch 100 posts at a time

  try {
    while (hasMore) {
      const { data: posts, error } = await supabase
        .from('tiktok_posts')
        .select('*')
        .eq('username', username)
        .gte('created_at', cutoffDateStr) // Filter by timeframe
        .order('created_at', { ascending: true })
        .range(page * pageSize, (page + 1) * pageSize - 1)

      if (error) {
        console.error(`Error fetching posts for ${username}:`, error)
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
  } catch (error) {
    console.error(`Error in pagination for ${username}:`, error)
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