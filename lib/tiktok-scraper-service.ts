const TIKTOK_API_HOST = 'tiktok-scraper7.p.rapidapi.com'
const RAPID_API_KEY = process.env.RAPID_API_KEY

if (!RAPID_API_KEY) {
  throw new Error('RAPID_API_KEY is not configured')
}

const headers = {
  'x-rapidapi-key': RAPID_API_KEY,
  'x-rapidapi-host': TIKTOK_API_HOST
}

export async function resolveUsername(username: string) {
  console.log('\n=== Resolving TikTok Username ===')

  // Remove @ symbol if present
  username = username.replace('@', '')
  console.log(`Processing username: ${username}`)

  // Use the user/info endpoint with the username
  const endpoint = `https://${TIKTOK_API_HOST}/user/info`
  const params = new URLSearchParams({ unique_id: username })
  const url = `${endpoint}?${params.toString()}`
  console.log(`Making request to: ${url}`)

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      }
    })

    console.log(`Response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Username resolution failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })
      throw new Error(`Failed to resolve username: ${response.statusText}. Details: ${errorText}`)
    }

    const data = await response.json()
    console.log('API Response structure:', Object.keys(data))

    if (!data || typeof data !== 'object') {
      console.error('Invalid response format:', data)
      throw new Error('Invalid response format from API')
    }

    // Check for user ID in both possible locations
    const userId = data.data?.user?.id || data.user?.id
    
    if (!userId) {
      console.error('Missing user ID in response:', data)
      throw new Error('User ID not found in API response')
    }

    console.log('Successfully resolved username:', {
      username,
      userId
    })

    return userId
  } catch (error) {
    console.error('Error in username resolution:', error)
    throw error
  }
}

export function extractUserId(input: string): string | null {
  console.log('\n=== Extracting User ID ===')
  console.log('Input:', input)

  // Only accept numeric IDs
  if (/^\d+$/.test(input)) {
    console.log('Valid numeric ID found:', input)
    return input
  }

  console.log('Input is not a valid numeric ID')
  return null
}

export async function getUserInfo(userId: string) {
  console.log('\n=== Fetching User Info ===')
  console.log('User ID:', userId)

  if (!userId || !/^\d+$/.test(userId)) {
    console.error('Invalid user ID:', userId)
    throw new Error('A valid numeric user ID is required')
  }

  const endpoint = `https://${TIKTOK_API_HOST}/user/info`
  const params = new URLSearchParams({ user_id: userId })
  const url = `${endpoint}?${params.toString()}`
  console.log(`Making request to: ${url}`)

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      }
    })

    console.log(`Response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('User info fetch failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })
      throw new Error(`Failed to fetch user info: ${response.statusText}. Details: ${errorText}`)
    }

    const data = await response.json()
    console.log('API Response structure:', Object.keys(data))
    console.log('User info:', JSON.stringify(data, null, 2))

    return data
  } catch (error) {
    console.error('Error fetching user info:', error)
    throw error
  }
}

export async function getUserPosts(userId: string, count: number = 10, cursor: string = '0') {
  console.log('\n=== Fetching User Posts ===')
  console.log('Parameters:', { userId, count, cursor })

  if (!userId || !/^\d+$/.test(userId)) {
    console.error('Invalid user ID:', userId)
    throw new Error('A valid numeric user ID is required')
  }

  const endpoint = `https://${TIKTOK_API_HOST}/user/posts`
  const params = new URLSearchParams({
    user_id: userId,
    count: count.toString(),
    cursor: cursor
  })
  const url = `${endpoint}?${params.toString()}`
  console.log(`Making request to: ${url}`)

  try {
    console.log('Making API request with headers:', {
      ...headers,
      'Content-Type': 'application/json'
    })

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      }
    })

    console.log(`Response status: ${response.status}`)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('User posts fetch failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })
      throw new Error(`Failed to fetch user posts: ${response.statusText}. Details: ${errorText}`)
    }

    const data = await response.json()
    console.log('API Response structure:', Object.keys(data))
    console.log('Raw API response:', JSON.stringify(data, null, 2))

    if (!data.data?.videos) {
      console.warn('No videos found in response. Full response:', data)
      return {
        data: {
          videos: []
        }
      }
    }

    console.log(`Found ${data.data.videos.length} videos in response`)
    console.log('First video data structure:', data.data.videos[0] ? Object.keys(data.data.videos[0]) : 'No videos')

    if (data.data.videos.length > 0) {
      const sampleVideo = data.data.videos[0]
      console.log('Sample video data:', {
        id: sampleVideo.video_id || sampleVideo.aweme_id,
        title: sampleVideo.title,
        stats: {
          plays: sampleVideo.play_count,
          likes: sampleVideo.digg_count,
          comments: sampleVideo.comment_count,
          shares: sampleVideo.share_count
        }
      })
    }

    // Transform videos into the expected format
    const transformedVideos = data.data.videos.map((video: any) => {
      const transformed = {
        id: video.video_id || video.aweme_id,
        video_id: video.video_id || video.aweme_id,
        desc: video.title || video.desc || '',
        createTime: video.create_time,
        cover: video.cover || video.origin_cover || video.dynamic_cover || video.thumbnail_url,
        playCount: video.play_count,
        diggCount: video.digg_count,
        commentCount: video.comment_count,
        shareCount: video.share_count,
        downloadCount: video.download_count,
        duration: video.duration,
        ratio: video.video_ratio,
        title: video.title || video.desc || '',
        stats: {
          playCount: video.play_count,
          diggCount: video.digg_count,
          commentCount: video.comment_count,
          shareCount: video.share_count,
          downloadCount: video.download_count
        }
      }
      console.log(`Transformed video ${transformed.id}:`, transformed)
      return transformed
    })

    console.log(`Successfully transformed ${transformedVideos.length} videos`)

    return {
      data: {
        videos: transformedVideos
      }
    }
  } catch (error) {
    console.error('Error fetching user posts:', error)
    throw error
  }
}

export function extractUsername(input: string): string | null {
  console.log('\n=== Extracting Username ===')
  console.log('Input:', input)

  // If input is already a username (with or without @)
  if (/^@?[\w.-]+$/.test(input)) {
    const username = input.replace('@', '')
    console.log('Valid username format found:', username)
    return username
  }

  // Try to extract username from URL
  const urlMatch = input.match(/(?:@|tiktok\.com\/@)([\w.-]+)/)
  if (urlMatch) {
    console.log('Username extracted from URL:', urlMatch[1])
    return urlMatch[1]
  }

  console.log('No valid username found in input')
  return null
} 