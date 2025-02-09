import { NextResponse } from "next/server"
import { getUserPosts, extractUserId, extractUsername, resolveUsername } from "@/lib/tiktok-scraper-service"
import { upsertTikTokPosts } from "@/lib/db/supabase"
import { getUserInfo } from "@/lib/tiktok-scraper-service"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const { profileUrl, count = 10, cursor = '0' } = await req.json()
    console.log('Received request for posts:', { profileUrl, count, cursor })

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

    console.log('Making request to TikTok API for user posts:', { userId, count, cursor })
    const apiResponse = await getUserPosts(userId, count, cursor)
    console.log('TikTok API response structure:', Object.keys(apiResponse))

    if (!apiResponse?.data?.videos) {
      console.log('No posts found or invalid response format')
      return NextResponse.json({
        success: true,
        data: { data: { videos: [] } },
        timestamp: new Date().toISOString(),
      })
    }

    // Get the username for the user
    const userInfo = await getUserInfo(userId)
    const username = userInfo.data.user.uniqueId

    // Store posts in Supabase
    const posts = apiResponse.data.videos.map((video: any) => ({
      id: video.id || video.video_id,
      username: username,
      description: video.desc || video.title || '',
      created_at: new Date(video.createTime * 1000).toISOString(),
      plays: video.playCount || 0,
      likes: video.diggCount || 0,
      shares: video.shareCount || 0,
      comments: video.commentCount || 0,
      bookmarks: video.downloadCount || 0,
      video_duration: video.duration || 0,
      video_ratio: video.ratio || '',
      video_cover_url: video.cover || '',
      video_play_url: video.play || '',
      music_title: video.music?.title || '',
      music_author: video.music?.author || '',
      music_is_original: video.music?.original || false,
      music_duration: video.music?.duration || 0,
      music_play_url: video.music?.play || '',
      is_pinned: video.is_top || false,
      is_ad: video.is_ad || false,
      region: video.region || '',
      hashtags: JSON.stringify(video.hashtags || []),
      mentions: JSON.stringify(video.mentions || [])
    }))

    console.log('Storing posts in Supabase:', posts.length)
    await upsertTikTokPosts(posts, username)

    // Return the transformed response
    return NextResponse.json({
      success: true,
      data: apiResponse.data,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error fetching TikTok posts:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch TikTok posts",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
} 