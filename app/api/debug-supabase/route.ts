import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

export async function GET(request: Request) {
  try {
    // Create clients
    const cookieStore = cookies()
    
    // Debug cookies
    const allCookies = cookieStore.getAll()
    const cookieHeader = cookieStore.toString()
    const authCookie = cookieStore.get('sb-127-auth-token')
    
    // Regular client (user role)
    const supabaseClient = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Admin client (service role)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get and verify session
    const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession()
    
    // Get request headers
    const headers = Object.fromEntries(
      Array.from(request.headers.entries())
        .filter(([key]) => !key.includes('sec-'))
    )
    
    // Basic auth check
    if (sessionError || !sessionData.session) {
      return NextResponse.json({
        error: 'No authenticated session',
        details: sessionError,
        cookies: {
          all: allCookies.map(c => ({ name: c.name, value: `${c.value.substring(0, 10)}...` })),
          header: cookieHeader,
          authCookie: authCookie ? {
            name: authCookie.name,
            value: `${authCookie.value.substring(0, 10)}...`,
            exists: true
          } : { exists: false }
        },
        headers
      }, { status: 401 })
    }

    const userId = sessionData.session.user.id
    
    // Continue with database checks if session exists
    try {
      // Check system tables (admin only)
      const { data: policies, error: policiesError } = await supabaseAdmin.rpc('get_policies')
      
      // Debug RLS policies specifically for team_members
      const teamMembersPolicies = policies?.filter(p => 
        p.tablename === 'team_members' || p.tablename === 'teams'
      ) || []
      
      // Attempt to query team_members with user role
      const { data: teamMembers, error: teamMembersError } = await supabaseClient
        .from('team_members')
        .select('*')
        .eq('user_id', userId)
      
      // Attempt to query teams with user role
      const { data: teams, error: teamsError } = await supabaseClient
        .from('teams')
        .select('*')
      
      // Test direct queries with admin role
      const { data: adminTeamMembers, error: adminTeamMembersError } = await supabaseAdmin
        .from('team_members')
        .select('*')
        .eq('user_id', userId)
      
      const { data: adminTeams, error: adminTeamsError } = await supabaseAdmin
        .from('teams')
        .select('*')
      
      return NextResponse.json({
        user: {
          id: userId,
          email: sessionData.session.user.email
        },
        cookies: {
          all: allCookies.map(c => ({ name: c.name, value: `${c.value.substring(0, 10)}...` })),
          authCookie: authCookie ? {
            name: authCookie.name,
            value: `${authCookie.value.substring(0, 10)}...`,
            exists: true
          } : { exists: false }
        },
        headers,
        tables: {
          teamMembers: {
            success: !teamMembersError,
            count: teamMembers?.length || 0,
            error: teamMembersError,
            data: teamMembers
          },
          teams: {
            success: !teamsError,
            count: teams?.length || 0,
            error: teamsError,
            data: teams
          }
        },
        adminAccess: {
          teamMembers: {
            success: !adminTeamMembersError,
            count: adminTeamMembers?.length || 0,
            error: adminTeamMembersError,
            data: adminTeamMembers
          },
          teams: {
            success: !adminTeamsError,
            count: adminTeams?.length || 0,
            error: adminTeamsError,
            data: adminTeams
          }
        },
        rls: {
          teamMembersPolicies,
          policiesError
        }
      })
    } catch (dbError) {
      return NextResponse.json({
        error: 'Database error',
        details: dbError instanceof Error ? dbError.message : String(dbError),
        user: {
          id: userId,
          email: sessionData.session.user.email
        },
        cookies: {
          all: allCookies.map(c => ({ name: c.name, value: `${c.value.substring(0, 10)}...` })),
          authCookie: authCookie ? {
            name: authCookie.name,
            value: `${authCookie.value.substring(0, 10)}...`,
            exists: true
          } : { exists: false }
        },
        headers
      }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 