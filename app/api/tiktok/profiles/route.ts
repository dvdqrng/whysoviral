import { NextResponse } from "next/server"
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Create a Supabase client specifically for route handlers
    const cookieStore = cookies()
    const supabaseClient = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Fetch all users from the tiktok_accounts table
    const { data: users, error: usersError } = await supabaseClient
      .from('tiktok_accounts')
      .select('*')
      .order('last_updated', { ascending: false })

    if (usersError) {
      throw usersError
    }

    // Return the accounts directly without trying to fetch posts
    const validProfiles = users.map(user => ({
      user,
      posts: [] // Empty array since we don't have a posts table yet
    }));

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