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

    let userId = profileUrl;
    let username = '';

    // If it's not already a numeric ID, try to resolve it
    if (!extractUserId(profileUrl)) {
      console.log('Input is not a numeric ID, attempting to resolve username')

      // First extract the username from the input
      const extractedUsername = extractUsername(profileUrl)
      if (!extractedUsername) {
        return NextResponse.json({
          error: "Invalid input format. Please provide a valid TikTok username or user ID.",
          receivedInput: profileUrl
        }, { status: 400 })
      }

      username = extractedUsername;

      try {
        // Try to resolve username to ID
        userId = await resolveUsername(extractedUsername)
        console.log(`Resolved username ${extractedUsername} to ID ${userId}`)
      } catch (resolveError) {
        console.error('Error resolving username:', resolveError)

        // If we can't resolve the username, try to fetch user info directly 
        try {
          console.log(`Attempting to fetch user info directly for username: ${extractedUsername}`)
          const userInfoResponse = await getUserInfo(extractedUsername)

          if (userInfoResponse?.data?.user?.id) {
            userId = userInfoResponse.data.user.id
            console.log(`Successfully got user ID ${userId} from user info for username ${extractedUsername}`)
          } else {
            return NextResponse.json({
              success: false,
              error: `Could not resolve username ${extractedUsername} to a user ID`
            }, { status: 404 })
          }
        } catch (userInfoError) {
          console.error('Error getting user info:', userInfoError)
          return NextResponse.json({
            success: false,
            error: `Failed to retrieve user info for ${extractedUsername}: ${userInfoError.message}`
          }, { status: 500 })
        }
      }
    } else {
      // It's a user ID, try to get the username for database storage
      try {
        const userInfo = await getUserInfo(userId)
        username = userInfo.data.user.uniqueId
        console.log(`Retrieved username ${username} for user ID ${userId}`)
      } catch (userError) {
        console.error('Error getting username from ID:', userError)
        // Continue with just the ID, we'll use it as username for storage if needed
        username = userId
      }
    }

    console.log('Making request to TikTok API for user posts:', { userId, count, cursor })

    // Handle rate limiting with exponential backoff
    let retries = 0;
    let apiResponse;

    while (retries < 3) {
      try {
        apiResponse = await getUserPosts(userId, count, cursor);
        break; // Success, exit loop
      } catch (error) {
        if (error.message && error.message.includes('Too Many Requests')) {
          retries++;
          const delay = Math.pow(2, retries) * 1000; // Exponential backoff: 2s, 4s, 8s
          console.log(`Rate limited. Retry ${retries}/3 after ${delay}ms delay`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error; // Not a rate limit error, re-throw
        }
      }
    }

    if (!apiResponse) {
      return NextResponse.json({
        success: false,
        error: "Failed to fetch posts after multiple retries due to rate limiting",
      }, { status: 429 });
    }

    console.log('TikTok API response structure:', Object.keys(apiResponse))

    if (!apiResponse?.data?.videos) {
      console.log('No posts found or invalid response format')
      return NextResponse.json({
        success: true,
        data: {
          data: {
            videos: [],
            cursor: cursor,
            hasMore: false
          }
        },
        timestamp: new Date().toISOString(),
      })
    }

    // Store posts in Supabase
    const posts = apiResponse.data.videos.map((video: any) => ({
      id: video.id || video.video_id,
      username: username,
      description: video.desc || video.title || '',
      created_at: new Date((video.createTime || video.create_time) * 1000).toISOString(),
      plays: video.playCount || video.play_count || 0,
      likes: video.diggCount || video.digg_count || 0,
      shares: video.shareCount || video.share_count || 0,
      comments: video.commentCount || video.comment_count || 0,
      bookmarks: video.downloadCount || video.download_count || 0,
      video_duration: video.duration || 0,
      video_ratio: video.ratio || video.video_ratio || '',
      video_cover_url: video.cover || video.cover_image_url || '',
      video_play_url: video.play || video.play_url || '',
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

    console.log(`Storing ${posts.length} posts in Supabase for username: ${username}`)
    await upsertTikTokPosts(posts, username)

    // Return the transformed response with cursor for pagination
    return NextResponse.json({
      success: true,
      data: {
        data: {
          videos: apiResponse.data.videos,
          hasMore: apiResponse.data.hasMore || false,
          cursor: apiResponse.data.cursor || cursor
        }
      },
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