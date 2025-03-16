import { NextResponse } from 'next/server'
import { TeamService } from '@/lib/team-service'
import { TeamInvitationService } from '@/lib/team-invitation-service'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

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

// Get team invitations
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

    // Check if user is an admin of the team using our helper function
    const isAdmin = await isUserTeamAdmin(userId, teamId, supabase)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to view team invitations' },
        { status: 403 }
      )
    }

    // Get team invitations directly using the route handler client
    const { data: invitations, error: invitationsError } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('team_id', teamId)

    if (invitationsError) {
      console.error('Error fetching team invitations:', invitationsError)
      return NextResponse.json(
        { error: 'Failed to fetch team invitations' },
        { status: 500 }
      )
    }

    return NextResponse.json({ invitations })
  } catch (error: any) {
    console.error(`Error in GET /api/teams/${params.team_id}/invitations:`, error)
    return NextResponse.json(
      { error: error.message || 'An error occurred while fetching team invitations' },
      { status: 500 }
    )
  }
}

// Create a new invitation
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

    // Check if user is an admin of the team using our helper function
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

    // Get team info for the invitation email
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('name')
      .eq('id', teamId)
      .single()

    if (teamError) {
      console.error('Error fetching team info:', teamError)
      return NextResponse.json(
        { error: 'Failed to fetch team information' },
        { status: 500 }
      )
    }

    // Create a unique token for the invitation
    const token = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // Expires in 7 days

    // Insert the invitation into the database
    const { data: invitation, error: invitationError } = await supabase
      .from('team_invitations')
      .insert({
        team_id: teamId,
        email: email,
        role: role,
        invited_by: userId,
        token: token,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()

    if (invitationError) {
      console.error('Error creating invitation:', invitationError)
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      )
    }

    // TODO: Send invitation email
    // This would typically call an email service
    console.log(`Invitation email would be sent to ${email} for team ${team.name} with role ${role}`)

    return NextResponse.json({ invitation }, { status: 201 })
  } catch (error: any) {
    console.error(`Error in POST /api/teams/${params.team_id}/invitations:`, error)
    return NextResponse.json(
      { error: error.message || 'An error occurred while creating the invitation' },
      { status: 500 }
    )
  }
}

// Delete an invitation
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

    // Check if user is an admin of the team using our helper function
    const isAdmin = await isUserTeamAdmin(userId, teamId, supabase)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to delete invitations for this team' },
        { status: 403 }
      )
    }

    // Parse URL to get invitationId from search params
    const url = new URL(request.url)
    const invitationId = url.searchParams.get('invitationId')

    if (!invitationId) {
      return NextResponse.json(
        { error: 'Invitation ID is required' },
        { status: 400 }
      )
    }

    // Delete the invitation directly using the route handler client
    const { error: deleteError } = await supabase
      .from('team_invitations')
      .delete()
      .eq('id', invitationId)
      .eq('team_id', teamId)

    if (deleteError) {
      console.error('Error deleting invitation:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete invitation' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error(`Error in DELETE /api/teams/${params.team_id}/invitations:`, error)
    return NextResponse.json(
      { error: error.message || 'An error occurred while deleting the invitation' },
      { status: 500 }
    )
  }
} 