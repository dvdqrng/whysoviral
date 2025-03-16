import { getSupabaseClient } from '@/lib/supabase'
import { Team, TeamMember, TeamInvitation, TeamTikTokGroup, TEAMS_TABLE, TEAM_MEMBERS_TABLE, TEAM_TIKTOK_GROUPS_TABLE, TEAM_INVITATIONS_TABLE } from '../models/team'
import { v4 as uuidv4 } from 'uuid'

// Create a new team
export async function createTeam(name: string, description: string | null, ownerId: string): Promise<Team> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from(TEAMS_TABLE)
    .insert({
      name,
      description,
      owner_id: ownerId,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating team:', error)
    throw error
  }

  return data as Team
}

// Get a team by ID
export async function getTeamById(teamId: string): Promise<Team | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from(TEAMS_TABLE)
    .select(`
      *,
      members:${TEAM_MEMBERS_TABLE}(*)
    `)
    .eq('id', teamId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') { // Record not found
      return null
    }
    console.error('Error getting team:', error)
    throw error
  }

  return data as Team
}

// Get all teams for a user
export async function getUserTeams(userId: string): Promise<Team[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from(TEAM_MEMBERS_TABLE)
    .select(`
      team:${TEAMS_TABLE}(
        *,
        members:${TEAM_MEMBERS_TABLE}(*)
      )
    `)
    .eq('user_id', userId)

  if (error) {
    console.error('Error getting user teams:', error)
    throw error
  }

  // Transform the response to get teams directly
  return data.map(item => item.team) as unknown as Team[]
}

// Update a team
export async function updateTeam(teamId: string, name: string, description: string | null): Promise<Team> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from(TEAMS_TABLE)
    .update({
      name,
      description,
      updated_at: new Date().toISOString(),
    })
    .eq('id', teamId)
    .select()
    .single()

  if (error) {
    console.error('Error updating team:', error)
    throw error
  }

  return data as Team
}

// Delete a team
export async function deleteTeam(teamId: string): Promise<void> {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from(TEAMS_TABLE)
    .delete()
    .eq('id', teamId)

  if (error) {
    console.error('Error deleting team:', error)
    throw error
  }
}

// Add a member to a team
export async function addTeamMember(teamId: string, userId: string, role: 'admin' | 'member'): Promise<TeamMember> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from(TEAM_MEMBERS_TABLE)
    .insert({
      team_id: teamId,
      user_id: userId,
      role,
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding team member:', error)
    throw error
  }

  return data as TeamMember
}

// Update a team member's role
export async function updateTeamMemberRole(teamMemberId: string, role: 'admin' | 'member'): Promise<TeamMember> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from(TEAM_MEMBERS_TABLE)
    .update({
      role,
    })
    .eq('id', teamMemberId)
    .select()
    .single()

  if (error) {
    console.error('Error updating team member role:', error)
    throw error
  }

  return data as TeamMember
}

// Remove a member from a team
export async function removeTeamMember(teamMemberId: string): Promise<void> {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from(TEAM_MEMBERS_TABLE)
    .delete()
    .eq('id', teamMemberId)

  if (error) {
    console.error('Error removing team member:', error)
    throw error
  }
}

// Get all members of a team
export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from(TEAM_MEMBERS_TABLE)
    .select('*')
    .eq('team_id', teamId)

  if (error) {
    console.error('Error getting team members:', error)
    throw error
  }

  return data as TeamMember[]
}

// Associate a TikTok group with a team
export async function addTikTokGroupToTeam(teamId: string, tiktokGroupId: string): Promise<TeamTikTokGroup> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from(TEAM_TIKTOK_GROUPS_TABLE)
    .insert({
      team_id: teamId,
      tiktok_group_id: tiktokGroupId,
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding TikTok group to team:', error)
    throw error
  }

  return data as TeamTikTokGroup
}

// Remove a TikTok group from a team
export async function removeTikTokGroupFromTeam(teamTikTokGroupId: string): Promise<void> {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from(TEAM_TIKTOK_GROUPS_TABLE)
    .delete()
    .eq('id', teamTikTokGroupId)

  if (error) {
    console.error('Error removing TikTok group from team:', error)
    throw error
  }
}

// Get all TikTok groups associated with a team
export async function getTeamTikTokGroups(teamId: string): Promise<TeamTikTokGroup[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from(TEAM_TIKTOK_GROUPS_TABLE)
    .select('*')
    .eq('team_id', teamId)

  if (error) {
    console.error('Error getting team TikTok groups:', error)
    throw error
  }

  return data as TeamTikTokGroup[]
}

// Create a team invitation
export async function createTeamInvitation(
  teamId: string,
  email: string,
  role: 'admin' | 'member',
  createdBy: string
): Promise<TeamInvitation> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from(TEAM_INVITATIONS_TABLE)
    .insert({
      team_id: teamId,
      email,
      token: uuidv4(),
      role,
      created_by: createdBy,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      accepted: false,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating team invitation:', error)
    throw error
  }

  return data as TeamInvitation
}

// Get a team invitation by token
export async function getTeamInvitationByToken(token: string): Promise<TeamInvitation | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from(TEAM_INVITATIONS_TABLE)
    .select('*')
    .eq('token', token)
    .single()

  if (error) {
    if (error.code === 'PGRST116') { // Record not found
      return null
    }
    console.error('Error getting team invitation:', error)
    throw error
  }

  return data as TeamInvitation
}

// Accept a team invitation
export async function acceptTeamInvitation(token: string, userId: string): Promise<void> {
  const invitation = await getTeamInvitationByToken(token)
  if (!invitation) {
    throw new Error('Invitation not found')
  }

  if (new Date(invitation.expires_at) < new Date()) {
    throw new Error('Invitation has expired')
  }

  const supabase = getSupabaseClient()
  const { error: updateError } = await supabase
    .from(TEAM_INVITATIONS_TABLE)
    .update({
      accepted: true,
      accepted_at: new Date().toISOString(),
    })
    .eq('token', token)

  if (updateError) {
    console.error('Error accepting team invitation:', updateError)
    throw updateError
  }

  try {
    await addTeamMember(invitation.team_id, userId, invitation.role)
  } catch (error) {
    console.error('Error adding user to team after accepting invitation:', error)
    throw error
  }
}

// Delete a team invitation
export async function deleteTeamInvitation(invitationId: string): Promise<void> {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from(TEAM_INVITATIONS_TABLE)
    .delete()
    .eq('id', invitationId)

  if (error) {
    console.error('Error deleting team invitation:', error)
    throw error
  }
}

// Get all invitations for a team
export async function getTeamInvitations(teamId: string): Promise<TeamInvitation[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from(TEAM_INVITATIONS_TABLE)
    .select('*')
    .eq('team_id', teamId)
    .eq('accepted', false)
    .gte('expires_at', new Date().toISOString())

  if (error) {
    console.error('Error getting team invitations:', error)
    throw error
  }

  return data as TeamInvitation[]
} 