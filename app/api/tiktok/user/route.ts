import { NextResponse } from "next/server"
import { getTikTokUserStats } from "@/lib/tiktok-service"

export const runtime = "edge"
export const dynamic = "force-dynamic"

function extractUsername(url: string): string | null {
  const match = url.match(/(?:@|tiktok\.com\/@)([\w.-]+)/)
  return match ? match[1] : null
}

export async function POST(req: Request) {
  try {
    const { profileUrl } = await req.json()

    if (!profileUrl) {
      return NextResponse.json({ error: "Profile URL is required" }, { status: 400 })
    }

    const username = extractUsername(profileUrl)
    if (!username) {
      return NextResponse.json({ error: "Invalid TikTok profile URL" }, { status: 400 })
    }

    const stats = await getTikTokUserStats(username)

    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error fetching TikTok user stats:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch TikTok user stats",
      },
      { status: 500 },
    )
  }
}

