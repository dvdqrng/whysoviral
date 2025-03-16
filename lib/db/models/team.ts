// Team database model and types

export type TeamRole = 'owner' | 'admin' | 'member'

export type TeamMember = {
  id: string
  user_id: string
  team_id: string
  role: TeamRole
  created_at: string
  email?: string
  display_name?: string
  avatar_url?: string
}

export type TeamTikTokGroup = {
  id: string
  team_id: string
  tiktok_group_id: string
  created_at: string
}

export type Team = {
  id: string
  name: string
  description?: string
  owner_id: string
  created_at: string
  updated_at: string
  members?: TeamMember[]
  tiktok_groups?: TeamTikTokGroup[]
}

export type TeamInvitation = {
  id: string
  team_id: string
  email: string
  token: string
  role: TeamRole
  created_by: string
  created_at: string
  expires_at: string
  accepted: boolean
  accepted_at?: string
}

// Database table names
export const TEAMS_TABLE = 'teams'
export const TEAM_MEMBERS_TABLE = 'team_members'
export const TEAM_TIKTOK_GROUPS_TABLE = 'team_tiktok_groups'
export const TEAM_INVITATIONS_TABLE = 'team_invitations' 