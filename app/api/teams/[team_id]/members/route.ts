import { NextResponse } from 'next/server'
import { TeamService } from '@/lib/team-service'
import { TeamInvitationService } from '@/lib/team-invitation-service'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Helper function to check if a user is a team member using the route handler client
async function isUserTeamMember(userId: string, teamId: string, supabaseClient: any): Promise<boolean> {
  try {
    const { data, error } = await supabaseClient
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // Record not found
        return false
      }
      console.error('Error checking if user is team member:', error)
      throw error
    }

    return !!data
  } catch (error) {
    console.error('Error checking if user is team member:', error)
    return false
  }
}

// Helper function to check if a user is a team admin using the route handler client
async function isUserTeamAdmin(userId: string, teamId: string, supabaseClient: any): Promise<boolean> {
  try {
    const { data, error } = await supabaseClient
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .in('role', ['owner', 'admin'])
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // Record not found
        return false
      }
      console.error('Error checking if user is team admin:', error)
      throw error
    }

    return !!data
  } catch (error) {
    console.error('Error checking if user is team admin:', error)
    return false
  }
}

// Get team members
export async function GET(
  request: Request,
  { params }: { params: { team_id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Check if user is authenticated
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const teamId = params.team_id

    // Check if user is a member of the team using our helper function
    const isMember = await isUserTeamMember(userId, teamId, supabase)
    if (!isMember) {
      return NextResponse.json(
        { error: 'You do not have permission to view this team' },
        { status: 403 }
      )
    }

    // Get team members directly using the route handler client
    const { data: members, error: membersError } = await supabase
      .from('team_members')
      .select(`
        id,
        team_id,
        user_id,
        role,
        created_at,
        accepted_at,
        profiles:user_id (
          id,
          email,
          display_name,
          avatar_url
        )
      `)
      .eq('team_id', teamId)

    if (membersError) {
      console.error('Error fetching team members:', membersError)
      return NextResponse.json(
        { error: 'Failed to fetch team members' },
        { status: 500 }
      )
    }

    // Transform the data to match the expected format
    const transformedMembers = members.map(member => ({
      id: member.id,
      team_id: member.team_id,
      user_id: member.user_id,
      role: member.role,
      created_at: member.created_at,
      accepted_at: member.accepted_at,
      user_details: member.profiles
    }))

    return NextResponse.json({ members: transformedMembers })
  } catch (error: any) {
    console.error(`Error in GET /api/teams/${params.team_id}/members:`, error)
    return NextResponse.json(
      { error: error.message || 'An error occurred while fetching team members' },
      { status: 500 }
    )
  }
}

// Invite a new member to the team
export async function POST(
  request: Request,
  { params }: { params: { team_id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Check if user is authenticated
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const teamId = params.team_id

    // Check if user is an admin or owner of the team using our helper function
    const isAdmin = await isUserTeamAdmin(userId, teamId, supabase)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to invite members to this team' },
        { status: 403 }
      )
    }

    const { email, role } = await request.json()

    // Validate input
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    if (!role || (role !== 'admin' && role !== 'member')) {
      return NextResponse.json(
        { error: 'Role must be either "admin" or "member"' },
        { status: 400 }
      )
    }

    // Send invitation
    const invitation = await TeamInvitationService.inviteUserByEmail(
      teamId,
      email,
      role,
      userId
    )

    return NextResponse.json({ invitation }, { status: 201 })
  } catch (error: any) {
    console.error(`Error in POST /api/teams/${params.team_id}/members:`, error)
    return NextResponse.json(
      { error: error.message || 'An error occurred while inviting the team member' },
      { status: 500 }
    )
  }
}

// Update a team member's role
export async function PATCH(
  request: Request,
  { params }: { params: { team_id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Check if user is authenticated
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const teamId = params.team_id

    // Check if user is an admin or owner of the team using our helper function
    const isAdmin = await isUserTeamAdmin(userId, teamId, supabase)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to update member roles in this team' },
        { status: 403 }
      )
    }

    const { memberId, role } = await request.json()

    // Validate input
    if (!memberId || typeof memberId !== 'string') {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      )
    }

    if (!role || (role !== 'admin' && role !== 'member')) {
      return NextResponse.json(
        { error: 'Role must be either "admin" or "member"' },
        { status: 400 }
      )
    }

    // Get the member to check if they're the owner
    const { data: members, error: membersError } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)

    if (membersError) {
      console.error('Error fetching team members:', membersError)
      return NextResponse.json(
        { error: 'Failed to fetch team members' },
        { status: 500 }
      )
    }

    const memberToUpdate = members.find(m => m.id === memberId)

    if (!memberToUpdate) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    // Cannot change the role of the owner
    if (memberToUpdate.role === 'owner') {
      return NextResponse.json(
        { error: 'Cannot change the role of the team owner' },
        { status: 400 }
      )
    }

    // Update the member's role
    const { data: updatedMember, error: updateError } = await supabase
      .from('team_members')
      .update({ role })
      .eq('id', memberId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating team member role:', updateError)
      return NextResponse.json(
        { error: 'Failed to update member role' },
        { status: 500 }
      )
    }

    return NextResponse.json({ member: updatedMember })
  } catch (error: any) {
    console.error(`Error in PATCH /api/teams/${params.team_id}/members:`, error)
    return NextResponse.json(
      { error: error.message || 'An error occurred while updating the member role' },
      { status: 500 }
    )
  }
}

// Remove a member from the team
export async function DELETE(
  request: Request,
  { params }: { params: { team_id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Check if user is authenticated
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const teamId = params.team_id

    // Parse URL to get memberId from search params
    const url = new URL(request.url)
    const memberId = url.searchParams.get('memberId')

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      )
    }

    // Get the member to check if they're the owner
    const { data: members, error: membersError } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)

    if (membersError) {
      console.error('Error fetching team members:', membersError)
      return NextResponse.json(
        { error: 'Failed to fetch team members' },
        { status: 500 }
      )
    }

    const memberToRemove = members.find(m => m.id === memberId)

    if (!memberToRemove) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    // Cannot remove the owner
    if (memberToRemove.role === 'owner') {
      return NextResponse.json(
        { error: 'Cannot remove the team owner' },
        { status: 400 }
      )
    }

    // Check if user is an admin/owner or is removing themselves
    const isAdmin = await isUserTeamAdmin(userId, teamId, supabase)
    const isSelf = memberToRemove.user_id === userId

    if (!isAdmin && !isSelf) {
      return NextResponse.json(
        { error: 'You do not have permission to remove this member' },
        { status: 403 }
      )
    }

    // Remove the member
    const { error: deleteError } = await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId)

    if (deleteError) {
      console.error('Error removing team member:', deleteError)
      return NextResponse.json(
        { error: 'Failed to remove team member' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error(`Error in DELETE /api/teams/${params.team_id}/members:`, error)
    return NextResponse.json(
      { error: error.message || 'An error occurred while removing the team member' },
      { status: 500 }
    )
  }
} 