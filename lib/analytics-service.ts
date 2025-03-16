import { dbSupabase } from './db/supabase'

interface PostAnalytics {
  avgViewsPerPost: number
  avgTimeBetweenPosts: number // in hours
  weeklyPostFrequency: { week: string; count: number }[]
  viewsTrend: { date: string; views: number }[]
}

export async function calculateUserAnalytics(username: string): Promise<PostAnalytics> {
  // Fetch user's posts ordered by creation date
  const { data: posts, error } = await dbSupabase
    .from('tiktok_posts')
    .select('*')
    .eq('username', username)
    .order('created_at', { ascending: true })

  if (error) throw error
  if (!posts || posts.length === 0) {
    throw new Error('No posts found for user')
  }

  // Calculate average views per post
  const totalViews = posts.reduce((sum, post) => sum + (post.plays || 0), 0)
  const avgViewsPerPost = Math.round(totalViews / posts.length)

  // Calculate average time between posts
  const sortedPosts = [...posts].sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  let totalTimeBetween = 0
  let timeDiffs = []
  for (let i = 1; i < sortedPosts.length; i++) {
    const timeDiff = new Date(sortedPosts[i].created_at).getTime() - new Date(sortedPosts[i - 1].created_at).getTime()
    totalTimeBetween += timeDiff
    timeDiffs.push(timeDiff)
  }
  const avgTimeBetweenPosts = (totalTimeBetween / (posts.length - 1)) / (1000 * 60 * 60) // Convert to hours

  // Get posts from the last 10 weeks
  const tenWeeksAgo = new Date()
  tenWeeksAgo.setDate(tenWeeksAgo.getDate() - 70) // 10 weeks * 7 days

  const recentPosts = posts.filter(post => new Date(post.created_at) >= tenWeeksAgo)

  // Calculate weekly post frequency for the last 10 weeks
  const weeklyPosts = new Map<string, number>()

  // Initialize all 10 weeks with 0
  for (let i = 0; i < 10; i++) {
    const weekStart = new Date(tenWeeksAgo.getTime() + (i * 7 * 24 * 60 * 60 * 1000))
    const weekKey = weekStart.toISOString().slice(0, 10)
    weeklyPosts.set(weekKey, 0)
  }

  // Count posts per week
  recentPosts.forEach(post => {
    const postDate = new Date(post.created_at)
    const weekStart = new Date(postDate)
    weekStart.setHours(0, 0, 0, 0)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // Start of week
    const weekKey = weekStart.toISOString().slice(0, 10)
    weeklyPosts.set(weekKey, (weeklyPosts.get(weekKey) || 0) + 1)
  })

  const weeklyPostFrequency = Array.from(weeklyPosts.entries())
    .map(([week, count]) => ({ week, count }))
    .sort((a, b) => a.week.localeCompare(b.week))

  // Calculate views trend for the last 10 weeks
  const viewsTrend = recentPosts
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map(post => ({
      date: new Date(post.created_at).toISOString().slice(0, 10),
      views: post.plays || 0
    }))

  // Store the calculated analytics
  await dbSupabase
    .from('users')
    .update({
      avg_views_per_post: avgViewsPerPost,
      avg_time_between_posts: avgTimeBetweenPosts,
      weekly_post_frequency: weeklyPostFrequency,
      views_trend: viewsTrend,
      last_analytics_update: new Date().toISOString()
    })
    .eq('username', username)

  return {
    avgViewsPerPost,
    avgTimeBetweenPosts,
    weeklyPostFrequency,
    viewsTrend
  }
} 