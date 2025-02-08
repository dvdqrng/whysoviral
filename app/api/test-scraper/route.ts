import { NextResponse } from "next/server"

const TIKTOK_API_HOST = 'tiktok-scraper7.p.rapidapi.com'
const RAPID_API_KEY = process.env.RAPID_API_KEY

if (!RAPID_API_KEY) {
  throw new Error('RAPID_API_KEY is not configured')
}

const headers = {
  'x-rapidapi-key': RAPID_API_KEY,
  'x-rapidapi-host': TIKTOK_API_HOST
}

export async function GET(req: Request) {
  try {
    // Test user ID - using a known TikTok user ID
    const TEST_USER_ID = '107955'

    // Test user info endpoint
    console.log('Testing user info endpoint...')
    const userInfoResponse = await fetch(
      `https://${TIKTOK_API_HOST}/user/info?user_id=${TEST_USER_ID}`,
      {
        method: 'GET',
        headers
      }
    )

    const userInfo = await userInfoResponse.json()
    console.log('User info response:', userInfo)

    // Test user posts endpoint
    console.log('Testing user posts endpoint...')
    const userPostsResponse = await fetch(
      `https://${TIKTOK_API_HOST}/user/posts?user_id=${TEST_USER_ID}&count=10&cursor=0`,
      {
        method: 'GET',
        headers
      }
    )

    const userPosts = await userPostsResponse.json()
    console.log('User posts response:', userPosts)

    // Return both results
    return NextResponse.json({
      success: true,
      userInfo: {
        status: userInfoResponse.status,
        data: userInfo
      },
      userPosts: {
        status: userPostsResponse.status,
        data: userPosts
      }
    })

  } catch (error) {
    console.error('Error testing TikTok Scraper API:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to test TikTok Scraper API',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
} 