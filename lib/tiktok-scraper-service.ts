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
  // Remove @ symbol if present
  username = username.replace('@', '')

  console.log(`Resolving username: ${username}`)

  // Use the feed/user endpoint which is more reliable for username resolution
  const endpoint = `https://${TIKTOK_API_HOST}/feed/user`
  console.log(`Making request to: ${endpoint}`)

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      unique_id: username
    })
  })

  console.log(`Username resolution status: ${response.status}`)

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`Username resolution failed with status ${response.status}:`, errorText)
    throw new Error(`Failed to resolve username: ${response.statusText}. Details: ${errorText}`)
  }

  const data = await response.json()
  console.log(`Username resolution response:`, data)

  if (!data || typeof data !== 'object') {
    throw new Error('Invalid response format from API')
  }

  if (!data.user?.id) {
    console.error('Missing user ID in response:', data)
    throw new Error('User ID not found in API response')
  }

  return data.user.id
}

// Helper function to check if input is a valid TikTok user ID
export function extractUserId(input: string): string | null {
  // Only accept numeric IDs
  if (/^\d+$/.test(input)) {
    return input
  }
  return null
}

export async function getUserInfo(userId: string) {
  if (!userId || !/^\d+$/.test(userId)) {
    throw new Error('A valid numeric user ID is required')
  }

  const endpoint = `https://${TIKTOK_API_HOST}/user/info`
  console.log(`Fetching user info from: ${endpoint} for user ID: ${userId}`)

  const response = await fetch(`${endpoint}?user_id=${userId}`, {
    method: 'GET',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    }
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`User info fetch failed with status ${response.status}:`, errorText)
    throw new Error(`Failed to fetch user info: ${response.statusText}. Details: ${errorText}`)
  }

  return response.json()
}

export async function getUserPosts(userId: string, count: number = 10, cursor: string = '0') {
  if (!userId || !/^\d+$/.test(userId)) {
    throw new Error('A valid numeric user ID is required')
  }

  const endpoint = `https://${TIKTOK_API_HOST}/user/posts`
  console.log(`Fetching user posts from: ${endpoint} for user ID: ${userId}`)

  const response = await fetch(
    `${endpoint}?user_id=${userId}&count=${count}&cursor=${cursor}`,
    {
      method: 'GET',
      headers
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`User posts fetch failed with status ${response.status}:`, errorText)
    throw new Error(`Failed to fetch user posts: ${response.statusText}. Details: ${errorText}`)
  }

  return response.json()
}

// Helper function to handle user input (either numeric ID, username, or URL)
export function extractUsername(input: string): string | null {
  // If input is already a username (with or without @)
  if (/^@?[\w.-]+$/.test(input)) {
    return input.replace('@', '')
  }

  // Try to extract username from URL (e.g., https://www.tiktok.com/@username)
  const urlMatch = input.match(/(?:@|tiktok\.com\/@)([\w.-]+)/)
  if (urlMatch) {
    return urlMatch[1]
  }

  return null
} 