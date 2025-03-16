import { NextResponse } from 'next/server'
import { TeamInvitationService } from '@/lib/team-invitation-service'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Process a team invitation
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if user is authenticated
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized. You must be logged in to accept an invitation.' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      )
    }

    const result = await TeamInvitationService.processInvitation(token, userId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      )
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error in POST /api/teams/join:', error)
    return NextResponse.json(
      { error: error.message || 'An error occurred while processing the invitation' },
      { status: 500 }
    )
  }
} 