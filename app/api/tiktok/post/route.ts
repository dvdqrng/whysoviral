import { NextResponse } from "next/server"
import { getTikTokPostData } from "@/lib/tiktok-post-service"

export const runtime = "edge"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const { url } = await req.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    const data = await getTikTokPostData(url)

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error fetching TikTok post data:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch TikTok post data",
      },
      { status: 500 },
    )
  }
}

