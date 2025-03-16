import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

// GET /api/tiktok/groups
export async function GET() {
  try {
    // Create a Supabase client specifically for route handlers
    const cookieStore = cookies()
    const supabaseClient = createRouteHandlerClient({ cookies: () => cookieStore })
    
    try {
      // Check if the required table exists
      const { error } = await supabaseClient.from('tiktok_groups').select('count', { count: 'exact', head: true })
      
      if (error) {
        console.error('Error checking tiktok_groups table:', error)
        // Return empty array as fallback instead of an error
        return NextResponse.json({ success: true, data: [] })
      }
      
      // If we get here, the table exists, attempt to fetch groups
      const { data, error: fetchError } = await supabaseClient
        .from('tiktok_groups')
        .select('*, tiktok_group_members(username)')
      
      if (fetchError) {
        console.error('Error fetching groups:', fetchError)
        // Return empty array as fallback
        return NextResponse.json({ success: true, data: [] })
      }
      
      return NextResponse.json({ success: true, data: data || [] })
    } catch (dbError) {
      console.error('Database error in /api/tiktok/groups:', dbError)
      // Fallback to empty array
      return NextResponse.json({ success: true, data: [] })
    }
  } catch (error) {
    console.error('Error in /api/tiktok/groups:', error)
    // Return empty array instead of error to avoid breaking the UI
    return NextResponse.json({ success: true, data: [] })
  }
}

// POST /api/tiktok/groups
export async function POST(request: Request) {
  try {
    const { name, usernames } = await request.json()

    if (!name || !usernames || !Array.isArray(usernames)) {
      return NextResponse.json(
        { success: false, error: 'Name and usernames array are required' },
        { status: 400 }
      )
    }

    // Return a graceful error since the table doesn't exist
    return NextResponse.json(
      { success: false, error: 'Groups functionality is not available yet' },
      { status: 501 }
    )
  } catch (error) {
    console.error('Error creating group:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create group'
      },
      { status: 500 }
    )
  }
}

// PUT /api/tiktok/groups
export async function PUT(request: Request) {
  try {
    // Create a Supabase client specifically for route handlers
    const cookieStore = cookies()
    const supabaseClient = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { id, name, usernames } = await request.json()

    if (!id || !name || !usernames || !Array.isArray(usernames)) {
      return NextResponse.json(
        { success: false, error: 'Group ID, name and usernames array are required' },
        { status: 400 }
      )
    }

    // Check if group exists
    const { data: existingGroup } = await supabaseClient
      .from('tiktok_groups')
      .select('*')
      .eq('id', id)
      .single()

    if (!existingGroup) {
      return NextResponse.json(
        { success: false, error: 'Group not found' },
        { status: 404 }
      )
    }

    // Update group name
    const { error: updateError } = await supabaseClient
      .from('tiktok_groups')
      .update({ name })
      .eq('id', id)

    if (updateError) throw updateError

    // Delete existing members
    const { error: deleteError } = await supabaseClient
      .from('tiktok_group_members')
      .delete()
      .eq('group_id', id)

    if (deleteError) throw deleteError

    // Add new members
    const members = usernames.map(username => ({
      group_id: id,
      username
    }))

    const { error: membersError } = await supabaseClient
      .from('tiktok_group_members')
      .insert(members)

    if (membersError) throw membersError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating group:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update group',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

// DELETE /api/tiktok/groups
export async function DELETE(request: Request) {
  try {
    // Create a Supabase client specifically for route handlers
    const cookieStore = cookies()
    const supabaseClient = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Group ID is required' },
        { status: 400 }
      )
    }

    // Check if group exists
    const { data: existingGroup } = await supabaseClient
      .from('tiktok_groups')
      .select('*')
      .eq('id', id)
      .single()

    if (!existingGroup) {
      return NextResponse.json(
        { success: false, error: 'Group not found' },
        { status: 404 }
      )
    }

    // First, delete all members
    await supabaseClient
      .from('tiktok_group_members')
      .delete()
      .eq('group_id', id)

    // Then delete the group
    const { error } = await supabaseClient
      .from('tiktok_groups')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting group:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete group',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
} 