import { NextResponse } from "next/server"
import { getUserInfo, extractUserId, extractUsername, resolveUsername } from "@/lib/tiktok-scraper-service"
import { upsertTikTokUser, trackUserSearch } from "@/lib/db/supabase"
import { supabase } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    // Get the authenticated user's session
    const { data: { session } } = await supabase.auth.getSession()
    const authenticatedUid = session?.user?.id

    const { profileUrl } = await req.json()
    console.log('Received request for profile:', profileUrl)

    if (!profileUrl) {
      return NextResponse.json({ error: "Profile URL is required" }, { status: 400 })
    }

    let userId = profileUrl

    // If it's not already a numeric ID, try to resolve it
    if (!extractUserId(profileUrl)) {
      console.log('Input is not a numeric ID, attempting to resolve username')
      const username = extractUsername(profileUrl)
      if (!username) {
        return NextResponse.json({
          error: "Invalid input format. Please provide a valid TikTok username or user ID.",
          receivedInput: profileUrl
        }, { status: 400 })
      }
      userId = await resolveUsername(username)
    }

    console.log('Making request to TikTok API for user ID:', userId)
    const apiResponse = await getUserInfo(userId)
    console.log('TikTok API response structure:', Object.keys(apiResponse))

    if (!apiResponse?.data?.user) {
      throw new Error('Invalid API response format')
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
      avatar: apiResponse.data.user.avatarLarger,
      profile_url: `https://www.tiktok.com/@${apiResponse.data.user.uniqueId}`
    }

    // Store the TikTok user data
    await upsertTikTokUser(userData)

    // Track the search only if we have an authenticated user
    if (authenticatedUid) {
      await trackUserSearch(userData.user_id, authenticatedUid)
    }

    // Transform the response to match expected structure
    const transformedData = {
      data: {
        user: {
          id: userId,
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

