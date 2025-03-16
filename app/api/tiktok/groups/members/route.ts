import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export const dynamic = 'force-dynamic'

// POST /api/tiktok/groups/members
export async function POST(request: Request) {
  try {
    // Create a Supabase client specifically for route handlers
    const cookieStore = cookies()
    const supabaseClient = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { group_id, username } = await request.json()

    if (!group_id || !username) {
      return NextResponse.json(
        { success: false, error: 'Group ID and username are required' },
        { status: 400 }
      )
    }

    // Check if member already exists
    const { data: existingMember } = await supabaseClient
      .from('tiktok_group_members')
      .select('*')
      .eq('group_id', group_id)
      .eq('username', username)
      .single()

    if (existingMember) {
      return NextResponse.json(
        { success: false, error: 'Member already exists in group' },
        { status: 400 }
      )
    }

    // Add member to group
    const { data, error } = await supabaseClient
      .from('tiktok_group_members')
      .insert({
        group_id,
        username
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error adding member to group:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add member to group',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

// DELETE /api/tiktok/groups/members
export async function DELETE(request: Request) {
  try {
    // Create a Supabase client specifically for route handlers
    const cookieStore = cookies()
    const supabaseClient = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { searchParams } = new URL(request.url)
    const group_id = searchParams.get('group_id')
    const username = searchParams.get('username')

    if (!group_id || !username) {
      return NextResponse.json(
        { success: false, error: 'Group ID and username are required' },
        { status: 400 }
      )
    }

    // Delete member from group
    const { error } = await supabaseClient
      .from('tiktok_group_members')
      .delete()
      .eq('group_id', group_id)
      .eq('username', username)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing group member:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove group member',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
} 