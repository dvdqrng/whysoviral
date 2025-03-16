import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { v4 as uuidv4 } from 'uuid'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

// Get all teams for the current user
export async function GET(request: Request) {
  try {
    // Log headers for debugging
    console.log('Request headers:', 
      Object.fromEntries(
        Array.from(request.headers.entries())
          .filter(([key]) => !key.includes('sec-') && !key.includes('accept-encoding'))
      )
    )
    
    // Create a Supabase client specifically for route handlers
    const cookieStore = cookies()
    const supabaseClient = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Try getting session from route handler client
    console.log('Attempting to get session in GET /api/teams using route handler client')
    const sessionResult = await supabaseClient.auth.getSession()
    console.log('Route handler session result:', JSON.stringify({
      hasData: !!sessionResult.data,
      hasSession: !!sessionResult.data.session,
      error: sessionResult.error,
    }))
    
    const session = sessionResult.data.session

    // Basic auth check
    if (!session) {
      console.log('No session found in GET /api/teams')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log(`Authenticated as user: ${session.user.id} in GET /api/teams`)
    const userId = session.user.id

    // DEBUG: Log the query that will be executed
    console.log(`Querying team_members for user_id = ${userId}`)
    
    // Improved query approach using two separate queries instead of nested select
    // First, get the team memberships for the user
    const { data: memberships, error: membershipError } = await supabaseClient
      .from('team_members')
      .select('team_id, role')
      .eq('user_id', userId)

    if (membershipError) {
      console.error('Error fetching team memberships:', membershipError)
      return NextResponse.json(
        { 
          error: 'Failed to fetch team memberships',
          details: membershipError.message,
          code: membershipError.code || 'unknown'
        },
        { status: 500 }
      )
    }

    // Get all team IDs
    const teamIds = memberships.map(m => m.team_id)
    console.log(`Found ${teamIds.length} teams for user ${userId}:`, teamIds)
    
    if (teamIds.length === 0) {
      // Return empty array if user has no teams
      return NextResponse.json({ teams: [] })
    }

    // Then get the teams data using the team IDs
    const { data: teamsData, error: teamsError } = await supabaseClient
      .from('teams')
      .select('id, name, description, created_at')
      .in('id', teamIds)

    if (teamsError) {
      console.error('Error fetching teams data:', teamsError)
      return NextResponse.json(
        { error: 'Failed to fetch teams data' },
        { status: 500 }
      )
    }

    // Combine the data
    const teams = teamsData.map(team => {
      const membership = memberships.find(m => m.team_id === team.id)
      return {
        id: team.id,
        name: team.name,
        description: team.description,
        role: membership?.role || 'member',
        created_at: team.created_at
      }
    })

    return NextResponse.json({ teams })
  } catch (error) {
    console.error('Error in teams API:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// Create a new team
export async function POST(request: Request) {
  try {
    // Log headers for debugging
    console.log('POST /api/teams - Request headers:', 
      Object.fromEntries(
        Array.from(request.headers.entries())
          .filter(([key]) => !key.includes('sec-') && !key.includes('accept-encoding'))
      )
    )
    
    // Create a Supabase client specifically for route handlers
    const cookieStore = cookies()
    const supabaseClient = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Try getting session from route handler client
    console.log('Attempting to get session in POST /api/teams using route handler client')
    const sessionResult = await supabaseClient.auth.getSession()
    console.log('Route handler session result:', JSON.stringify({
      hasData: !!sessionResult.data,
      hasSession: !!sessionResult.data.session,
      error: sessionResult.error,
    }))
    
    const session = sessionResult.data.session

    // Basic auth check
    if (!session) {
      console.log('No session found in POST /api/teams')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log(`Authenticated as user: ${session.user.id} in POST /api/teams`)
    const userId = session.user.id
    
    // Parse request body
    const { name, description } = await request.json()
    
    // Validate input
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      )
    }

    // Create a team transaction
    const teamId = uuidv4()
    
    // DEBUG: Log the operations that will be performed
    console.log(`Creating new team with id ${teamId} for user ${userId}`)
    
    // 1. Insert the team
    const { error: teamError } = await supabaseClient
      .from('teams')
      .insert({
        id: teamId,
        name,
        description: description || null,
        owner_id: userId  // Set the owner_id to the current user ID
      })

    if (teamError) {
      console.error('Error creating team:', teamError)
      return NextResponse.json(
        { error: 'Failed to create team' },
        { status: 500 }
      )
    }

    // 2. Add the creator as an admin
    console.log(`Adding user ${userId} as admin to team ${teamId}`)
    const { error: memberError } = await supabaseClient
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: userId,
        role: 'admin',
        accepted_at: new Date().toISOString()
      })

    if (memberError) {
      console.error('Error adding user to team:', memberError)
      // Try to clean up the team if membership creation fails
      await supabaseClient.from('teams').delete().eq('id', teamId)
      return NextResponse.json(
        { error: 'Failed to add you to the team' },
        { status: 500 }
      )
    }

    // 3. Create a default account group
    const { error: groupError } = await supabaseClient
      .from('account_groups')
      .insert({
        team_id: teamId,
        name: 'My Accounts',
        description: 'Default account group'
      })

    if (groupError) {
      console.error('Error creating default group:', groupError)
      // Continue anyway, this is not critical
    }

    return NextResponse.json({
      team: {
        id: teamId,
        name,
        description: description || null,
        role: 'admin'
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error in create team API:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
} 