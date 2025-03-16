import { NextResponse } from 'next/server'
import { TeamService } from '@/lib/team-service'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Get a team by ID
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

    // Check if user is a member of the team
    const isMember = await TeamService.isUserTeamMember(userId, teamId)
    if (!isMember) {
      return NextResponse.json(
        { error: 'You do not have permission to view this team' },
        { status: 403 }
      )
    }

    const team = await TeamService.getTeamById(teamId)
    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ team })
  } catch (error: any) {
    console.error(`Error in GET /api/teams/${params.team_id}:`, error)
    return NextResponse.json(
      { error: error.message || 'An error occurred while fetching the team' },
      { status: 500 }
    )
  }
}

// Update a team
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

    // Check if user is an admin or owner of the team
    const isAdmin = await TeamService.isUserTeamAdmin(userId, teamId)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to update this team' },
        { status: 403 }
      )
    }

    const { name, description } = await request.json()

    // Validate input
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      )
    }

    const updatedTeam = await TeamService.updateTeam(teamId, name, description || null)

    return NextResponse.json({ team: updatedTeam })
  } catch (error: any) {
    console.error(`Error in PATCH /api/teams/${params.team_id}:`, error)
    return NextResponse.json(
      { error: error.message || 'An error occurred while updating the team' },
      { status: 500 }
    )
  }
}

// Delete a team
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

    // Check if user is the owner of the team
    const team = await TeamService.getTeamById(teamId)
    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      )
    }

    if (team.owner_id !== userId) {
      return NextResponse.json(
        { error: 'Only the team owner can delete the team' },
        { status: 403 }
      )
    }

    await TeamService.deleteTeam(teamId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error(`Error in DELETE /api/teams/${params.team_id}:`, error)
    return NextResponse.json(
      { error: error.message || 'An error occurred while deleting the team' },
      { status: 500 }
    )
  }
} 