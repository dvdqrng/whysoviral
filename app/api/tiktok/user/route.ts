import { NextResponse } from "next/server"
import { getUserInfo, extractUserId, extractUsername, resolveUsername } from "@/lib/tiktok-scraper-service"
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    // Create a Supabase client specifically for route handlers
    const cookieStore = cookies()
    const supabaseClient = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Get the authenticated user's session
    const { data: { session } } = await supabaseClient.auth.getSession()
    const authenticatedUid = session?.user?.id

    const { profileUrl } = await req.json()
    console.log('Received request for profile:', profileUrl)

    // Check if the profile URL is valid
    if (!profileUrl) {
      return NextResponse.json(
        { success: false, error: 'Profile URL is required' },
        { status: 400 }
      )
    }

    try {
      // First try to parse the URL for a username or ID
      const username = extractUsername(profileUrl)
      const userId = extractUserId(profileUrl)
      
      // If neither could be extracted, try to resolve the username from the full URL
      const resolvedUsername = !username && !userId ? await resolveUsername(profileUrl) : null
      
      // Use the best value we have, in order of preference
      const identifier = userId || username || resolvedUsername
      
      if (!identifier) {
        return NextResponse.json(
          { success: false, error: 'Could not extract valid username or user ID from the provided URL' },
          { status: 400 }
        )
      }
      
      // Fetch the user info
      const apiResponse = await getUserInfo(identifier)
      
      if (!apiResponse || !apiResponse.data || !apiResponse.data.user) {
        console.error('Failed to fetch TikTok user data for identifier:', identifier)
        return NextResponse.json(
          { success: false, error: 'Failed to fetch TikTok user data' },
          { status: 500 }
        )
      }

      // Store in Supabase
      const userData = {
        user_id: apiResponse.data.user.id,
        username: apiResponse.data.user.uniqueId,
        nickname: apiResponse.data.user.nickname,
        followers: apiResponse.data.stats.followerCount,
        following: apiResponse.data.stats.followingCount,
        likes: apiResponse.data.stats.heart,
        videos: apiResponse.data.stats.videoCount,
        verified: apiResponse.data.user.verified,
        bio: apiResponse.data.user.signature,
        avatar: apiResponse.data.user.avatarLarger || apiResponse.data.user.avatarThumb,
    // First try to parse the URL for a username or ID
    const username = extractUsername(profileUrl)
    const userId = extractUserId(profileUrl)
    
    // If neither could be extracted, try to resolve the username from the full URL
    const resolvedUsername = !username && !userId ? await resolveUsername(profileUrl) : null
    
    // Use the best value we have, in order of preference
    const identifier = userId || username || resolvedUsername
    
    if (!identifier) {
      return NextResponse.json(
        { success: false, error: 'Could not extract valid username or user ID from the provided URL' },
        { status: 400 }
      )
    }
    
    // Fetch the user info
    const apiResponse = await getUserInfo(identifier)
    
    if (!apiResponse || !apiResponse.data || !apiResponse.data.user) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch TikTok user data' },
        { status: 500 }
      )
    }

    // Store in Supabase
    const userData = {
      user_id: apiResponse.data.user.id,
      username: apiResponse.data.user.uniqueId,
      nickname: apiResponse.data.user.nickname,
      followers: apiResponse.data.stats.followerCount,
      following: apiResponse.data.stats.followingCount,
      likes: apiResponse.data.stats.heart,
      videos: apiResponse.data.stats.videoCount,
      verified: apiResponse.data.user.verified,
      bio: apiResponse.data.user.signature,
      avatar: apiResponse.data.user.avatarLarger || apiResponse.data.user.avatarThumb,
      profile_url: `https://www.tiktok.com/@${apiResponse.data.user.uniqueId}`
    }

    await upsertTikTokUser(userData, supabaseClient)

    // If authenticated, track this search
    if (authenticatedUid) {
      await trackUserSearch(userData.user_id, authenticatedUid, supabaseClient)
    }

    // Transform the response to match expected structure
    const transformedData = {
      data: {
        user: {
          id: identifier,
          uniqueId: apiResponse.data.user.uniqueId,
          nickname: apiResponse.data.user.nickname,
          avatarThumb: apiResponse.data.user.avatarThumb,
          signature: apiResponse.data.user.signature,
          verified: apiResponse.data.user.verified
        },
        stats: {
          followerCount: apiResponse.data.stats.followerCount,
          followingCount: apiResponse.data.stats.followingCount,
          heart: apiResponse.data.stats.heart,
          videoCount: apiResponse.data.stats.videoCount
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: transformedData,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error fetching TikTok user stats:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch TikTok user stats",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

// Function to upsert TikTok user data
async function upsertTikTokUser(userData: any, supabaseClient: any) {
  try {
    // Check if the TikTok account already exists
    const { data: existingAccounts } = await supabaseClient
      .from('tiktok_accounts')
      .select('id')
      .eq('user_id', userData.user_id)
      .limit(1)
    
    if (existingAccounts && existingAccounts.length > 0) {
      // Update existing account
      await supabaseClient
        .from('tiktok_accounts')
        .update({
          username: userData.username,
          nickname: userData.nickname,
          followers: userData.followers,
          following: userData.following,
          likes: userData.likes,
          videos: userData.videos,
          verified: userData.verified,
          bio: userData.bio,
          avatar: userData.avatar,
          profile_url: userData.profile_url,
          last_updated: new Date().toISOString()
        })
        .eq('user_id', userData.user_id)
    } else {
      // Insert new account
      await supabaseClient
        .from('tiktok_accounts')
        .insert({
          ...userData,
          last_updated: new Date().toISOString()
        })
    }
  } catch (error) {
    console.error('Error upserting TikTok user:', error)
    throw error
  }
}

// Function to track user searches
async function trackUserSearch(tiktokUserId: string, userId: string, supabaseClient: any) {
  try {
    await supabaseClient
      .from('tiktok_user_searches')
      .insert({
        tiktok_user_id: tiktokUserId,
        searched_by: userId
      })
  } catch (error) {
    // Just log the error but don't fail the request
    console.error('Error tracking user search:', error)
  }
}

