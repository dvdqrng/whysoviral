import { NextResponse } from "next/server"
import { getUserInfo, extractUserId, extractUsername, resolveUsername } from "@/lib/tiktok-scraper-service"

export const runtime = "edge"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const { profileUrl } = await req.json()
    console.log('Received request for user ID:', profileUrl)

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

    console.log('Making request to TikTok API for user ID:', profileUrl)
    const data = await getUserInfo(profileUrl)
    console.log('TikTok API response:', data)

    return NextResponse.json({
      success: true,
      data,
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

