import { NextResponse } from "next/server"
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

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

    // Create a Supabase client specifically for route handlers
    const cookieStore = cookies()
    const supabaseClient = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Fetch posts directly using the route handler client
    const { data: posts, error } = await supabaseClient
      .from('tiktok_posts')
      .select('*')
      .eq('username', username)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error fetching posts:', error)
      throw error
    }

    return NextResponse.json({
      success: true,
      data: posts || [],
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