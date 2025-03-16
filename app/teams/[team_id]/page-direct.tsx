'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, UserPlus, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase-browser'

// Define types
interface Team {
  id: string
  name: string
  description: string | null
  owner_id: string
  created_at: string
}

interface TeamMember {
  id: string
  team_id: string
  user_id: string
  email: string
  role: 'owner' | 'admin' | 'member'
  created_at: string
  accepted_at: string | null
}

interface TeamInvitation {
  id: string
  team_id: string
  email: string
  role: 'admin' | 'member'
  created_at: string
  expires_at: string
  invited_by: string
}

export default function TeamPageDirect({ params }: { params: { team_id: string } }) {
  const teamId = params.team_id;
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('members');

  // Dialog states
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [isInviting, setIsInviting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [invitationToDelete, setInvitationToDelete] = useState<string | null>(null);
  const [resendingInvitation, setResendingInvitation] = useState<string | null>(null);

  const router = useRouter();

  // Fetch team data
  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Initialize Supabase client
        const supabase = createClient()

        // Log session for debugging
        const { data: sessionData } = await supabase.auth.getSession()
        console.log('TeamPageDirect - Auth session:', sessionData.session ? `Authenticated as ${sessionData.session.user.email}` : 'Not authenticated')

        if (!sessionData.session) {
          setError('Authentication required. Please log in.')
          setLoading(false)
          return
        }

        // Fetch team data
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select('*')
          .eq('id', params.team_id)
          .single()

        if (teamError) {
          console.error('Error fetching team:', teamError)
          setError('Failed to load team data.')
          setLoading(false)
          return
        }

        setTeam(teamData as Team)

        // Fetch team members
        const { data: membersData, error: membersError } = await supabase
          .from('team_members')
          .select(`
            id, 
            team_id,
            user_id, 
            role, 
            created_at,
            accepted_at,
            users:user_id(email)
          `)
          .eq('team_id', params.team_id)

        if (membersError) {
          console.error('Error fetching members:', membersError)
          setError('Failed to load team members.')
        } else {
          console.log('Members data:', membersData)
          // Transform the data to include email from the users relation
          const transformedMembers = membersData.map(member => ({
            ...member,
            email: member.users?.email || 'Unknown email'
          }))
          console.log('Transformed members:', transformedMembers)
          setMembers(transformedMembers || [])
        }

        // Fetch invitations
        await fetchInvitations()

        setLoading(false)
      } catch (err) {
        console.error('Error in fetchTeamData:', err)
        setError('An unexpected error occurred.')
        setLoading(false)
      }
    }

    fetchTeamData()
  }, [params.team_id])

  // Fetch invitations
  const fetchInvitations = async () => {
    try {
      const supabase = createClient()

      const { data: invitationsData, error: invitationsError } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('team_id', params.team_id)
        .order('created_at', { ascending: false })

      if (invitationsError) {
        console.error('Error fetching invitations:', invitationsError)
        return false
      }

      setInvitations(invitationsData || [])
      return true
    } catch (err) {
      console.error('Error in fetchInvitations:', err)
      return false
    }
  }

  // Invite member
  const inviteMember = async (email: string, role: 'admin' | 'member') => {
    try {
      const supabase = createClient()

      // Create a new invitation
      const { data, error } = await supabase
        .from('team_invitations')
        .insert({
          team_id: params.team_id,
          email: email.toLowerCase().trim(),
          role,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        })
        .select()

      if (error) {
        console.error('Error creating invitation:', error)
        alert(`Failed to invite member: ${error.message}`)
        return false
      }

      // Trigger the invitation email via serverless function
      const { error: sendError } = await supabase.functions.invoke('send-team-invitation', {
        body: { invitation_id: data[0].id }
      })

      if (sendError) {
        console.error('Error sending invitation email:', sendError)
        alert('Invitation created but failed to send email. You can resend it later.')
      }

      return true
    } catch (err) {
      console.error('Error in inviteMember:', err)
      alert('Failed to invite member. Please try again.')
      return false
    }
  }

  // Update member role
  const updateMemberRole = async (memberId: string, newRole: 'admin' | 'member') => {
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('team_members')
        .update({ role: newRole })
        .eq('id', memberId)

      if (error) {
        console.error('Error updating member role:', error)
        alert(`Failed to update role: ${error.message}`)
        return false
      }

      // Update local state
      setMembers(members.map(member =>
        member.id === memberId ? { ...member, role: newRole } : member
      ))

      return true
    } catch (err) {
      console.error('Error in updateMemberRole:', err)
      alert('Failed to update member role. Please try again.')
      return false
    }
  }

  // Remove member
  const removeMember = async (memberId: string) => {
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId)

      if (error) {
        console.error('Error removing member:', error)
        alert(`Failed to remove member: ${error.message}`)
        return false
      }

      // Update local state
      setMembers(members.filter(member => member.id !== memberId))

      return true
    } catch (err) {
      console.error('Error in removeMember:', err)
      alert('Failed to remove member. Please try again.')
      return false
    }
  }

  // Delete invitation
  const deleteInvitation = async (invitationId: string) => {
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('team_invitations')
        .delete()
        .eq('id', invitationId)

      if (error) {
        console.error('Error deleting invitation:', error)
        alert(`Failed to delete invitation: ${error.message}`)
        return false
      }

      // Update local state
      setInvitations(invitations.filter(invitation => invitation.id !== invitationId))

      return true
    } catch (err) {
      console.error('Error in deleteInvitation:', err)
      alert('Failed to delete invitation. Please try again.')
      return false
    }
  }

  // Handle resending an invitation
  const handleResendInvitation = async (invitationId: string) => {
    try {
      setResendingInvitation(invitationId)
      await resendInvitation(invitationId)
    } catch (error) {
      console.error('Error resending invitation:', error)
    } finally {
      setResendingInvitation(null)
    }
  }

  // Update team
  const updateTeam = async (name: string, description?: string) => {
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('teams')
        .update({
          name,
          description: description || null
        })
        .eq('id', params.team_id)

      if (error) {
        console.error('Error updating team:', error)
        alert(`Failed to update team: ${error.message}`)
        return false
      }

      // Update local state
      setTeam({ ...team, name, description: description || null })
      alert('Team updated successfully!')

      return true
    } catch (err) {
      console.error('Error in updateTeam:', err)
      alert('Failed to update team. Please try again.')
      return false
    }
  }

  // Delete team
  const deleteTeam = async () => {
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', params.team_id)

      if (error) {
        console.error('Error deleting team:', error)
        alert(`Failed to delete team: ${error.message}`)
        return false
      }

      return true
    } catch (err) {
      console.error('Error in deleteTeam:', err)
      alert('Failed to delete team. Please try again.')
      return false
    }
  }

  // Handle inviting a member
  const handleInviteMember = async () => {
    if (!email.trim()) return

    try {
      setIsInviting(true)
      const success = await inviteMember(email, role)

      if (success) {
        setEmail('')
        setRole('member')
        setIsInviteDialogOpen(false)

        // Refresh the invitations list
        await fetchInvitations()
      }
    } catch (error) {
      console.error('Error inviting member:', error)
    } finally {
      setIsInviting(false)
    }
  }

  // Handle deleting an invitation
  const handleDeleteInvitation = async () => {
    if (!invitationToDelete) return

    try {
      const success = await deleteInvitation(invitationToDelete)
      if (success) {
        setInvitationToDelete(null)
        setIsDeleteDialogOpen(false)
        // Refresh the invitations list
        await fetchInvitations()
      }
    } catch (error) {
      console.error('Error deleting invitation:', error)
    }
  }

  // Member card component
  const MemberCard = ({ member }: { member: TeamMember }) => {
    return (
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium">{member.email}</div>
              <div className="text-sm text-gray-500 capitalize">{member.role}</div>
            </div>
            {isUserAdmin && member.role !== 'owner' && (
              <div className="flex space-x-2">
                {member.role === 'member' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateMemberRole(member.id, 'admin')}
                  >
                    Make Admin
                  </Button>
                )}
                {member.role === 'admin' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateMemberRole(member.id, 'member')}
                  >
                    Remove Admin
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeMember(member.id)}
                >
                  Remove
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render loading state
  if (loading) {
    return (
      <div className="container max-w-5xl py-8">
        <div className="flex items-center mb-8">
          <Button variant="outline" size="icon" className="mr-4" disabled>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-8 w-40" />
        </div>
        <Skeleton className="h-12 w-full mb-8" />
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  // Render error state
  if (error || !team) {
    return (
      <div className="container max-w-5xl py-8">
        <Link href="/teams">
          <Button variant="outline" size="icon" className="mb-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="p-8 text-center">
          <div className="text-red-500 mb-4">{error || 'Team not found'}</div>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  // Process member data
  const ownerMember = members.find(member => member.role === 'owner')
  const adminMembers = members.filter(member => member.role === 'admin')
  const regularMembers = members.filter(member => member.role === 'member')

  // Get current user's email from localStorage for role checking
  const currentUserEmail = typeof window !== 'undefined' ? window.localStorage.getItem('email') : null
  console.log('Current user email from localStorage:', currentUserEmail)
  console.log('Available members:', members)

  const isUserOwner = currentUserEmail && members.some(member =>
    member.role === 'owner' && member.email === currentUserEmail
  )

  const isUserAdmin = currentUserEmail && members.some(member =>
    (member.role === 'admin' || member.role === 'owner') && member.email === currentUserEmail
  )

  console.log('User role checks:', { isUserOwner, isUserAdmin, currentUserEmail })

  return (
    <div className="container max-w-5xl py-8">
      <div className="flex items-center mb-8">
        <Link href="/teams">
          <Button variant="outline" size="icon" className="mr-4">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">{team.name}</h1>
      </div>

      {team.description && (
        <p className="text-gray-500 mb-8">{team.description}</p>
      )}

      <Tabs defaultValue="members" className="mb-8">
        <TabsList className="mb-6">
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
          <TabsTrigger value="tiktok-groups">TikTok Groups</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Team Members</h2>
            {isUserAdmin && (
              <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Member
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                    <DialogDescription>
                      Send an invitation to join the team. The user will receive an email with the invitation.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        placeholder="colleague@example.com"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500">
                        The invitation will be sent to this email address.
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="role">Role</Label>
                      <Select value={role} onValueChange={(value) => setRole(value as 'admin' | 'member')}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">
                        {role === 'admin'
                          ? 'Admins can manage team members, invitations, and team settings.'
                          : 'Members can view and contribute to team content.'}
                      </p>
                    </div>
                  </div>
                  <DialogFooter className="sm:justify-between">
                    <div className="text-xs text-gray-500 hidden sm:block">
                      Invitation will expire in 7 days
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleInviteMember} disabled={!email.trim() || isInviting}>
                        {isInviting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Sending...
                          </>
                        ) : (
                          <>Send Invitation</>
                        )}
                      </Button>
                    </div>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="space-y-6">
            {/* Owner Section */}
            {ownerMember && (
              <Card className="mb-4">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{ownerMember.email}</div>
                      <div className="text-sm text-gray-500 capitalize">Owner</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Admin Section */}
            {adminMembers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-500">Administrators</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {adminMembers.map((member) => (
                      <MemberCard key={member.id} member={member} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Regular Members Section */}
            {regularMembers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-500">Members</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {regularMembers.map((member) => (
                      <MemberCard key={member.id} member={member} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {members.length === 0 && (
              <div className="text-center py-12 px-4">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium">No members yet</h3>
                <p className="text-gray-500 mt-2 mb-6">Invite team members to collaborate.</p>
                {isUserAdmin && (
                  <Button onClick={() => setIsInviteDialogOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Member
                  </Button>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="invitations">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Pending Invitations</h2>
            {isUserAdmin && (
              <Button onClick={() => setIsInviteDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
            )}
          </div>

          {invitations && invitations.length > 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {invitations.map((invitation) => (
                    <div key={invitation.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                          <UserPlus className="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                          <div className="font-medium">{invitation.email}</div>
                          <div className="text-sm text-gray-500">
                            Invited as {invitation.role === 'admin' ? 'Administrator' : 'Member'} •
                            {new Date(invitation.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-amber-600 mt-1">
                            Expires: {new Date(invitation.expires_at).toLocaleDateString()}
                            ({Math.ceil((new Date(invitation.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left)
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResendInvitation(invitation.id)}
                          disabled={resendingInvitation === invitation.id}
                        >
                          {resendingInvitation === invitation.id ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Sending...
                            </>
                          ) : (
                            'Resend'
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => {
                            setInvitationToDelete(invitation.id)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-12 px-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <UserPlus className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium">No pending invitations</h3>
              <p className="text-gray-500 mt-2 mb-6">
                Invite team members to collaborate on TikTok analysis.
              </p>
              {isUserAdmin && (
                <Button onClick={() => setIsInviteDialogOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Member
                </Button>
              )}
            </div>
          )}

          {isUserAdmin && (
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">How Invitations Work</h3>
              <Card>
                <CardContent className="pt-6">
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                    <li>Invitations are sent to the email address you specify</li>
                    <li>Invitations expire after 7 days</li>
                    <li>Users must have an account to accept invitations</li>
                    <li>If a user doesn't have an account, they'll need to create one first</li>
                    <li>You can resend invitations or cancel them at any time</li>
                  </ol>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="tiktok-groups">
          <div className="p-8 text-center">
            <h3 className="text-lg font-medium">TikTok Groups Management</h3>
            <p className="text-gray-500 mt-2">This feature will be implemented soon.</p>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          {isUserAdmin ? (
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Team Settings</CardTitle>
                  <CardDescription>
                    Update your team information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const name = formData.get('name') as string;
                      const description = formData.get('description') as string;
                      updateTeam(name, description || undefined);
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="team-name">Team Name</Label>
                      <Input
                        id="team-name"
                        name="name"
                        defaultValue={team.name}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="team-description">Description (optional)</Label>
                      <Textarea
                        id="team-description"
                        name="description"
                        defaultValue={team.description || ''}
                        placeholder="What is this team about?"
                        rows={3}
                      />
                    </div>
                    <Button type="submit">
                      Save Changes
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {isUserOwner && (
                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="text-red-600">Danger Zone</CardTitle>
                    <CardDescription>
                      These actions cannot be undone
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col space-y-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="destructive">
                            Delete Team
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete Team</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete this team? This action cannot be undone
                              and all team data will be permanently deleted.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => { }}>
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={async () => {
                                const success = await deleteTeam();
                                if (success) {
                                  router.push('/teams');
                                }
                              }}
                            >
                              Delete Team
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <p className="text-sm text-gray-500 mt-2">
                        This will delete the team and remove all members.
                        All associations with TikTok groups will be removed.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center py-12 px-4">
              <h3 className="text-lg font-medium">You don't have permission to manage team settings</h3>
              <p className="text-gray-500 mt-2">
                Only team administrators can manage team settings.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Invitation Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Invitation</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this invitation? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Keep Invitation
            </Button>
            <Button variant="destructive" onClick={handleDeleteInvitation}>
              Cancel Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 