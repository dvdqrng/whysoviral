import { NextResponse } from "next/server"
import { getTikTokUserPosts } from "@/lib/tiktok-service"

export const runtime = "edge"
export const dynamic = "force-dynamic"

function extractUsername(url: string): string | null {
  const match = url.match(/(?:@|tiktok\.com\/@)([\w.-]+)/)
  return match ? match[1] : null
}

export async function POST(req: Request) {
  try {
    const { profileUrl, cursor = "0" } = await req.json()

    if (!profileUrl) {
      return NextResponse.json({ error: "Profile URL is required" }, { status: 400 })
    }

    const username = extractUsername(profileUrl)
    if (!username) {
      return NextResponse.json({ error: "Invalid TikTok profile URL" }, { status: 400 })
    }

    const data = await getTikTokUserPosts(username, cursor)

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
      },
      { status: 500 },
    )
  }
} 