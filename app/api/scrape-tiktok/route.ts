import { NextResponse } from "next/server"
import { getTikTokMetrics } from "@/lib/tiktok-scraper"

export async function POST(req: Request) {
  try {
    const { url } = await req.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    const data = await getTikTokMetrics(url)

    return NextResponse.json({
      ...data,
      message:
        "Note: Due to TikTok's restrictions, exact metrics are not available through public APIs. Consider using TikTok's official API for business accounts.",
      videoUrl: url,
    })
  } catch (error) {
    console.error("Error in TikTok API:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch TikTok data",
        details: error instanceof Error ? error.message : String(error),
        suggestion: "Consider using TikTok's official API for business accounts to access detailed metrics.",
      },
      { status: 500 },
    )
  }
}

