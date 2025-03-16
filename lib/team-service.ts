import {
  createTeam as dbCreateTeam,
  getTeamById as dbGetTeamById,
  getUserTeams as dbGetUserTeams,
  updateTeam as dbUpdateTeam,
  deleteTeam as dbDeleteTeam,
  addTeamMember as dbAddTeamMember,
  updateTeamMemberRole as dbUpdateTeamMemberRole,
  removeTeamMember as dbRemoveTeamMember,
  getTeamMembers as dbGetTeamMembers,
  addTikTokGroupToTeam as dbAddTikTokGroupToTeam,
  removeTikTokGroupFromTeam as dbRemoveTikTokGroupFromTeam,
  getTeamTikTokGroups as dbGetTeamTikTokGroups,
  createTeamInvitation as dbCreateTeamInvitation,
  getTeamInvitationByToken as dbGetTeamInvitationByToken,
  acceptTeamInvitation as dbAcceptTeamInvitation,
  deleteTeamInvitation as dbDeleteTeamInvitation,
  getTeamInvitations as dbGetTeamInvitations,
} from './db/queries/teams'
import type { Team, TeamMember, TeamInvitation, TeamTikTokGroup } from './db/models/team'
import { getSupabaseClient } from './supabase'

/**
 * Team Service
 * 
 * Provides an interface for team operations, abstracting the database layer.
 */
export class TeamService {
  /**
   * Create a new team
   */
  static async createTeam(name: string, description: string | null, ownerId: string): Promise<Team> {
    return dbCreateTeam(name, description, ownerId)
  }

  /**
   * Get a team by ID
   */
  static async getTeamById(teamId: string): Promise<Team | null> {
    return dbGetTeamById(teamId)
  }

  /**
   * Get all teams for a user
   */
  static async getUserTeams(userId: string): Promise<Team[]> {
    return dbGetUserTeams(userId)
  }

  /**
   * Update a team
   */
  static async updateTeam(teamId: string, name: string, description: string | null): Promise<Team> {
    return dbUpdateTeam(teamId, name, description)
  }

  /**
   * Delete a team
   */
  static async deleteTeam(teamId: string): Promise<void> {
    return dbDeleteTeam(teamId)
  }

  /**
   * Add a member to a team
   */
  static async addTeamMember(teamId: string, userId: string, role: 'admin' | 'member'): Promise<TeamMember> {
    return dbAddTeamMember(teamId, userId, role)
  }

  /**
   * Update a team member's role
   */
  static async updateTeamMemberRole(teamMemberId: string, role: 'admin' | 'member'): Promise<TeamMember> {
    return dbUpdateTeamMemberRole(teamMemberId, role)
  }

  /**
   * Remove a member from a team
   */
  static async removeTeamMember(teamMemberId: string): Promise<void> {
    return dbRemoveTeamMember(teamMemberId)
  }

  /**
   * Get all members of a team, including user details
   */
  static async getTeamMembers(teamId: string): Promise<(TeamMember & { user_details?: any })[]> {
    const members = await dbGetTeamMembers(teamId)
    const supabase = getSupabaseClient()

    // Get user details for each member
    const userIds = members.map(member => member.user_id)
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, email, display_name, avatar_url')
      .in('id', userIds)

    if (error) {
      console.error('Error getting user details for team members:', error)
      return members
    }

    // Map user details to members
    return members.map(member => {
      const user = users.find(u => u.id === member.user_id)
      return {
        ...member,
        user_details: user,
      }
    })
  }

  /**
   * Associate a TikTok group with a team
   */
  static async addTikTokGroupToTeam(teamId: string, tiktokGroupId: string): Promise<TeamTikTokGroup> {
    return dbAddTikTokGroupToTeam(teamId, tiktokGroupId)
  }

  /**
   * Remove a TikTok group from a team
   */
  static async removeTikTokGroupFromTeam(teamTikTokGroupId: string): Promise<void> {
    return dbRemoveTikTokGroupFromTeam(teamTikTokGroupId)
  }

  /**
   * Get all TikTok groups associated with a team
   */
  static async getTeamTikTokGroups(teamId: string): Promise<TeamTikTokGroup[]> {
    const teamTikTokGroups = await dbGetTeamTikTokGroups(teamId)
    const supabase = getSupabaseClient()

    // Get TikTok group details
    const groupIds = teamTikTokGroups.map(ttg => ttg.tiktok_group_id)

    // Assuming there's a tiktok_groups table
    const { data: groups, error } = await supabase
      .from('tiktok_groups')
      .select('*')
      .in('id', groupIds)

    if (error) {
      console.error('Error getting TikTok groups for team:', error)
      return teamTikTokGroups
    }

    // Map TikTok group details to team TikTok groups
    return teamTikTokGroups.map(ttg => ({
      ...ttg,
      group_details: groups.find(g => g.id === ttg.tiktok_group_id),
    }))
  }

  /**
   * Create a team invitation
   */
  static async createTeamInvitation(
    teamId: string,
    email: string,
    role: 'admin' | 'member',
    createdBy: string
  ): Promise<TeamInvitation> {
    return dbCreateTeamInvitation(teamId, email, role, createdBy)
  }

  /**
   * Get a team invitation by token
   */
  static async getTeamInvitationByToken(token: string): Promise<TeamInvitation | null> {
    return dbGetTeamInvitationByToken(token)
  }

  /**
   * Accept a team invitation
   */
  static async acceptTeamInvitation(token: string, userId: string): Promise<void> {
    return dbAcceptTeamInvitation(token, userId)
  }

  /**
   * Delete a team invitation
   */
  static async deleteTeamInvitation(invitationId: string): Promise<void> {
    return dbDeleteTeamInvitation(invitationId)
  }

  /**
   * Get all invitations for a team
   */
  static async getTeamInvitations(teamId: string): Promise<TeamInvitation[]> {
    return dbGetTeamInvitations(teamId)
  }

  /**
   * Check if a user is a member of a team
   */
  static async isUserTeamMember(userId: string, teamId: string): Promise<boolean> {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
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
  }

  /**
   * Check if a user has admin or owner role in a team
   */
  static async isUserTeamAdmin(userId: string, teamId: string): Promise<boolean> {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
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
  }
} 