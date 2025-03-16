'use client'

import { useState, useEffect, useCallback } from 'react'
import { Team, TeamMember, TeamInvitation } from '@/lib/db/models/team'
import { toast } from 'sonner'
import supabase from '@/lib/supabase'

/**
 * Hook for fetching and managing teams
 */
export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [needsLogin, setNeedsLogin] = useState(false)

  // Helper to redirect to login
  const redirectToLogin = useCallback(() => {
    window.location.href = `/auth/login?redirectTo=${encodeURIComponent(window.location.pathname)}`
  }, [])

  // Fetch all teams for the current user
  const fetchTeams = async () => {
    try {
      setLoading(true);
      setError(null);
      setNeedsLogin(false);

      console.log('Fetching teams data...');
      
      // Get the current session to include token if available
      let authHeader = {};
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.access_token) {
          console.log('Adding auth token to request');
          authHeader = {
            'Authorization': `Bearer ${data.session.access_token}`
          };
        }
      } catch (err) {
        console.error('Error getting auth session:', err);
      }
      
      const response = await fetch('/api/teams', {
        method: 'GET',
        credentials: 'include', // Always include credentials
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest', // Add this to identify AJAX request
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache',
          ...authHeader
        }
      });

      // Better content type checking for handling HTML responses
      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.includes('application/json')) {
        console.error('Error fetching teams: Not authenticated, received HTML instead of JSON');
        
        // Try to get the text to see if it's a login page
        try {
          const text = await response.text();
          if (text.includes('login') || text.includes('Login') || text.includes('Sign in')) {
            console.log('Login page detected in response, user needs to authenticate');
            setNeedsLogin(true);
            setError('Authentication required. Please log in to access teams.');
          } else {
            setError('Unexpected HTML response received. Please try refreshing the page.');
          }
        } catch (textError) {
          console.error('Error reading response text:', textError);
          setError('Authentication required. Please log in to access teams.');
          setNeedsLogin(true);
        }
        
        setLoading(false);
        return;
      }

      if (!response.ok) {
        if (response.status === 401) {
          console.error('Unauthorized access (401) to teams API');
          setNeedsLogin(true);
          setError('Authentication required. Please log in to access teams.');
          setLoading(false);
          return;
        }
        
        // For other error statuses, try to get the error message from the JSON response
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || `API error: ${response.status}`);
        } catch (parseError) {
          throw new Error(`HTTP error: ${response.status}`);
        }
      }

      // Process the successful response
      const data = await response.json();
      setTeams(data.teams || []);
    } catch (error) {
      console.error('Error fetching teams:', error instanceof Error ? error.message : error);
      
      // Check for specific authentication-related error messages
      if (error instanceof Error && error.message?.includes('auth') || 
          error instanceof Error && error.message?.includes('login') || 
          error instanceof Error && error.message?.includes('Unauthorized') || 
          error instanceof Error && error.message?.includes('401')) {
        setNeedsLogin(true);
        setError('Authentication required. Please log in to access teams.');
      } else {
        setError(error instanceof Error ? error.message : 'An error occurred while fetching teams');
      }
    } finally {
      setLoading(false);
    }
  };

  // Create a new team
  const createTeam = useCallback(async (name: string, description?: string) => {
    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        credentials: 'include',
        body: JSON.stringify({ name, description }),
      })

      // Check for authentication issues
      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.includes('application/json')) {
        console.error('Error creating team: Not authenticated, received HTML instead of JSON');
        toast.error('Authentication required. Please log in to create teams.');
        setNeedsLogin(true);
        throw new Error('Authentication required');
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create team');
      }

      const data = await response.json();
      setTeams(prev => [...prev, data.team]);
      toast.success('Team created successfully');
      return data.team;
    } catch (err: any) {
      toast.error(err.message || 'An error occurred while creating the team');
      console.error('Error creating team:', err);
      
      // Check if this might be an auth error
      if (err.message && (
        err.message.includes('Authentication') ||
        err.message.includes('auth') ||
        err.message.includes('token') ||
        err.message.includes('session') ||
        err.message.includes('login')
      )) {
        setNeedsLogin(true);
      }
      
      throw err;
    }
  }, []);

  // Load teams when the hook is first used
  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  return {
    teams,
    loading,
    error,
    needsLogin,
    redirectToLogin,
    fetchTeams,
    createTeam,
  }
}

/**
 * Hook for managing a specific team
 */
export function useTeam(teamId: string) {
  const [team, setTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [invitations, setInvitations] = useState<TeamInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch team details
  const fetchTeam = useCallback(async () => {
    if (!teamId) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/teams/${teamId}`)
      if (!response.ok) {
        // Add more detailed error logging for auth errors
        if (response.status === 401) {
          console.error('Authentication error when fetching team. Status:', response.status)
          setError('Authentication error: Please log in again')
          return
        }
        
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch team')
      }

      const data = await response.json()
      setTeam(data.team || null)
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching the team')
      console.error('Error fetching team:', err)
    } finally {
      setLoading(false)
    }
  }, [teamId])

  // Fetch team members
  const fetchMembers = useCallback(async () => {
    if (!teamId) return

    try {
      const response = await fetch(`/api/teams/${teamId}/members`)
      if (!response.ok) {
        // Add more detailed error logging for auth errors
        if (response.status === 401) {
          console.error('Authentication error when fetching members. Status:', response.status)
          setError('Authentication error: Please log in again')
          return
        }
        
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch team members')
      }

      const data = await response.json()
      setMembers(data.members || [])
    } catch (err: any) {
      console.error('Error fetching team members:', err)
      toast.error(err.message || 'An error occurred while fetching team members')
    }
  }, [teamId])

  // Fetch team invitations
  const fetchInvitations = useCallback(async () => {
    if (!teamId) return

    try {
      const response = await fetch(`/api/teams/${teamId}/invitations`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch team invitations')
      }

      const data = await response.json()
      setInvitations(data.invitations || [])
    } catch (err: any) {
      console.error('Error fetching team invitations:', err)
      toast.error(err.message || 'An error occurred while fetching team invitations')
    }
  }, [teamId])

  // Invite a user to the team
  const inviteMember = useCallback(async (email: string, role: 'admin' | 'member') => {
    if (!teamId) return false

    try {
      const response = await fetch(`/api/teams/${teamId}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, role }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to invite member')
      }

      const data = await response.json()
      // Update the invitations list
      fetchInvitations()

      toast.success(`Invitation sent to ${email}`)
      return true
    } catch (err: any) {
      toast.error(err.message || 'An error occurred while inviting the member')
      console.error('Error inviting member:', err)
      return false
    }
  }, [teamId, fetchInvitations])

  // Delete an invitation
  const deleteInvitation = useCallback(async (invitationId: string) => {
    if (!teamId) return false

    try {
      const response = await fetch(`/api/teams/${teamId}/invitations?invitationId=${invitationId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete invitation')
      }

      // Update the invitations list
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId))

      toast.success('Invitation deleted')
      return true
    } catch (err: any) {
      toast.error(err.message || 'An error occurred while deleting the invitation')
      console.error('Error deleting invitation:', err)
      return false
    }
  }, [teamId])

  // Resend an invitation
  const resendInvitation = useCallback(async (invitationId: string) => {
    if (!teamId) return false

    try {
      const response = await fetch(`/api/teams/${teamId}/invitations/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invitationId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to resend invitation')
      }

      toast.success('Invitation resent')
      return true
    } catch (err: any) {
      toast.error(err.message || 'An error occurred while resending the invitation')
      console.error('Error resending invitation:', err)
      return false
    }
  }, [teamId])

  // Update a member's role
  const updateMemberRole = useCallback(async (memberId: string, role: 'admin' | 'member') => {
    if (!teamId) return false

    try {
      const response = await fetch(`/api/teams/${teamId}/members`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memberId, role }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update member role')
      }

      // Update the members list
      setMembers(prev =>
        prev.map(member =>
          member.id === memberId ? { ...member, role } : member
        )
      )

      toast.success('Member role updated')
      return true
    } catch (err: any) {
      toast.error(err.message || 'An error occurred while updating the member role')
      console.error('Error updating member role:', err)
      return false
    }
  }, [teamId])

  // Remove a member from the team
  const removeMember = useCallback(async (memberId: string) => {
    if (!teamId) return false

    try {
      const response = await fetch(`/api/teams/${teamId}/members?memberId=${memberId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to remove member')
      }

      // Update the members list
      setMembers(prev => prev.filter(member => member.id !== memberId))

      toast.success('Member removed from team')
      return true
    } catch (err: any) {
      toast.error(err.message || 'An error occurred while removing the member')
      console.error('Error removing member:', err)
      return false
    }
  }, [teamId])

  // Update team details
  const updateTeam = useCallback(async (name: string, description?: string) => {
    if (!teamId) return false

    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, description }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update team')
      }

      const data = await response.json()
      setTeam(data.team)

      toast.success('Team updated successfully')
      return true
    } catch (err: any) {
      toast.error(err.message || 'An error occurred while updating the team')
      console.error('Error updating team:', err)
      return false
    }
  }, [teamId])

  // Delete the team
  const deleteTeam = useCallback(async () => {
    if (!teamId) return false

    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete team')
      }

      toast.success('Team deleted successfully')
      return true
    } catch (err: any) {
      toast.error(err.message || 'An error occurred while deleting the team')
      console.error('Error deleting team:', err)
      return false
    }
  }, [teamId])

  // Load team data when the hook is first used
  useEffect(() => {
    if (teamId) {
      fetchTeam()
      fetchMembers()
      fetchInvitations()
    }
  }, [teamId, fetchTeam, fetchMembers, fetchInvitations])

  return {
    team,
    members,
    invitations,
    loading,
    error,
    fetchTeam,
    fetchMembers,
    fetchInvitations,
    inviteMember,
    updateMemberRole,
    removeMember,
    updateTeam,
    deleteTeam,
    deleteInvitation,
    resendInvitation,
  }
} 