import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { v4 as uuidv4 } from 'uuid'

// Get Supabase URL from environment variable
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
// This is a special admin route, so we'll use the service role key (NEVER expose this in client code)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

export async function POST(request: Request) {
  try {
    // Debug cookies and headers
    const cookieStore = cookies()
    console.log('Admin route - Request cookies:', cookieStore.getAll().map(c => c.name))
    console.log('Admin route - Request headers:', 
      Object.fromEntries(
        Array.from(request.headers.entries())
          .filter(([key]) => !key.includes('sec-') && !key.includes('accept-encoding'))
      )
    )
    
    // First get session using Next.js auth helpers - this works with the middleware
    const supabaseClient = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession()
    
    if (sessionError || !sessionData.session) {
      console.error('No authenticated session:', sessionError)
      return NextResponse.json(
        { error: 'Authentication required', details: sessionError },
        { status: 401 }
      )
    }
    
    // Now create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    const userId = sessionData.session.user.id
    console.log(`Admin route: Creating test team for user ${userId}`)
    
    // Create a unique team ID
    const teamId = uuidv4()
    
    // Parse request body for team data
    const { name = 'Test Team (Admin Created)', description = 'This team was created using admin privileges' } = 
      await request.json().catch(() => ({}))
    
    // 1. Insert the team using admin privileges that bypass RLS
    const { error: teamError } = await supabaseAdmin
      .from('teams')
      .insert({
        id: teamId,
        name,
        description,
        owner_id: userId
      })
    
    if (teamError) {
      console.error('Admin route: Error creating team:', teamError)
      return NextResponse.json(
        { error: 'Failed to create team', details: teamError },
        { status: 500 }
      )
    }
    
    // 2. Add the user as an admin - also using admin privileges
    const { error: memberError } = await supabaseAdmin
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: userId,
        role: 'admin',
        accepted_at: new Date().toISOString()
      })
    
    if (memberError) {
      console.error('Admin route: Error adding user to team:', memberError)
      // Try to clean up
      await supabaseAdmin.from('teams').delete().eq('id', teamId)
      return NextResponse.json(
        { error: 'Failed to add user to team', details: memberError },
        { status: 500 }
      )
    }
    
    // 3. Create a default account group
    const { error: groupError } = await supabaseAdmin
      .from('account_groups')
      .insert({
        team_id: teamId,
        name: 'My Accounts',
        description: 'Default account group'
      })
    
    if (groupError) {
      console.error('Admin route: Error creating account group:', groupError)
      // Non-critical, continue
    }
    
    return NextResponse.json({
      success: true,
      team: {
        id: teamId,
        name,
        description,
        role: 'admin'
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Admin route: Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 