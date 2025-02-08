import { NextResponse } from "next/server"
import { getUserPosts, extractUserId, extractUsername, resolveUsername } from "@/lib/tiktok-scraper-service"

export const runtime = "edge"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const { profileUrl, cursor = "0", count = 10 } = await req.json()
    console.log('Received request for posts:', { profileUrl, cursor, count })

    if (!profileUrl) {
      return NextResponse.json({ error: "Profile URL is required" }, { status: 400 })
    }

    // Ensure we have a valid numeric ID
    if (!profileUrl.match(/^\d+$/)) {
      return NextResponse.json({
        error: "Invalid user ID format. Must be numeric.",
        receivedId: profileUrl
      }, { status: 400 })
    }

    console.log('Making request to TikTok API for posts:', { userId: profileUrl, cursor, count })
    const data = await getUserPosts(profileUrl, count, cursor)
    console.log('TikTok API posts response:', data)

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error fetching TikTok user posts:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch TikTok user posts",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
} 