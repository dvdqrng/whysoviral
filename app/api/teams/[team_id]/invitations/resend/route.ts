import { NextResponse } from 'next/server'
import { TeamService } from '@/lib/team-service'
import { TeamInvitationService } from '@/lib/team-invitation-service'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Resend an invitation
export async function POST(
  request: Request,
  { params }: { params: { team_id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

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

    // Check if user is an admin of the team
    const isAdmin = await TeamService.isUserTeamAdmin(userId, teamId)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to manage invitations for this team' },
        { status: 403 }
      )
    }

    const { invitationId } = await request.json()

    if (!invitationId) {
      return NextResponse.json(
        { error: 'Invitation ID is required' },
        { status: 400 }
      )
    }

    const result = await TeamInvitationService.resendInvitation(invitationId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      )
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error(`Error in POST /api/teams/${params.team_id}/invitations/resend:`, error)
    return NextResponse.json(
      { error: error.message || 'An error occurred while resending the invitation' },
      { status: 500 }
    )
  }
} 