import { NextResponse } from "next/server"
import { supabase } from "@/lib/db/supabase"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Fetch all users from the tiktok_users table
    const { data: users, error: usersError } = await supabase
      .from('tiktok_users')
      .select('*')
      .order('last_updated', { ascending: false })

    if (usersError) {
      throw usersError
    }

    // For each user, fetch their posts
    const profiles = await Promise.all(
      users.map(async (user) => {
        const { data: posts, error: postsError } = await supabase
          .from('tiktok_posts')
          .select('*')
          .eq('username', user.username)
          .order('created_at', { ascending: false })

        if (postsError) {
          console.error(`Error fetching posts for ${user.username}:`, postsError)
          return null
        }

        return {
          user,
          posts: posts || []
        }
      })
    )

    // Filter out any null results from failed fetches
    const validProfiles = profiles.filter(profile => profile !== null)

    return NextResponse.json({
      success: true,
      data: validProfiles,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("Error fetching TikTok profiles:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch TikTok profiles",
      },
      { status: 500 }
    )
  }
} 