import { NextResponse } from "next/server"
import { getTikTokPostsFromDB } from "@/lib/db/supabase"

export const dynamic = "force-dynamic"

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 })
    }

    const posts = await getTikTokPostsFromDB(username)

    return NextResponse.json({
      success: true,
      data: posts,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error fetching TikTok posts from DB:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch TikTok posts",
      },
      { status: 500 },
    )
  }
} 