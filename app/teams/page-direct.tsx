'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, Plus, ArrowRight, LogIn } from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'

export default function TeamsPageDirect() {
  const [user, setUser] = useState<any>(null)
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [newTeamDescription, setNewTeamDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setAuthLoading(true)
        const supabase = createClient()
        const { data } = await supabase.auth.getSession()

        console.log('TeamsPageDirect - Auth check:', data.session ? `Authenticated as ${data.session.user.email}` : 'Not authenticated')

        if (data.session) {
          setUser(data.session.user)
          // Store the email in localStorage for other pages
          if (data.session.user.email) {
            localStorage.setItem('email', data.session.user.email)
          }
        } else {
          setUser(null)
        }
      } catch (err) {
        console.error('Error checking auth:', err)
      } finally {
        setAuthLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Fetch teams when user is loaded
  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchTeams = async () => {
      try {
        setLoading(true)
        setError(null)

        const supabase = createClient()

        // Get teams the user is a member of
        const { data: teamMembers, error: memberError } = await supabase
          .from('team_members')
          .select(`
            team_id,
            role,
            teams:team_id(
              id,
              name,
              description,
              created_at
            )
          `)
          .eq('user_id', user.id)

        if (memberError) {
          console.error('Error fetching team members:', memberError)
          throw new Error('Failed to load your teams')
        }

        // Format teams data
        const formattedTeams = teamMembers.map(member => ({
          id: (member.teams as any).id,
          name: (member.teams as any).name,
          description: (member.teams as any).description,
          created_at: (member.teams as any).created_at,
          role: member.role
        }))

        setTeams(formattedTeams || [])
      } catch (err: any) {
        console.error('Error fetching teams:', err)
        setError(err.message || 'An error occurred while loading teams')
      } finally {
        setLoading(false)
      }
    }

    fetchTeams()
  }, [user])

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return

    try {
      setIsCreating(true)
      const supabase = createClient()

      // First create the team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: newTeamName,
          description: newTeamDescription || null
        })
        .select()
        .single()

      if (teamError) {
        console.error('Error creating team:', teamError)
        throw new Error('Failed to create team')
      }

      // Then add the current user as the owner
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: user.id,
          role: 'owner'
        })

      if (memberError) {
        console.error('Error adding team owner:', memberError)
        throw new Error('Failed to set team ownership')
      }

      // Add the new team to the list
      setTeams(prevTeams => [...prevTeams, {
        id: team.id,
        name: team.name,
        description: team.description,
        created_at: team.created_at,
        role: 'owner'
      }])

      setNewTeamName('')
      setNewTeamDescription('')
      setIsCreateDialogOpen(false)
    } catch (err: any) {
      console.error('Error creating team:', err)
      alert(err.message || 'Failed to create team')
    } finally {
      setIsCreating(false)
    }
  }

  // Combined loading state
  if (authLoading || loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Your Teams</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-4">
                <Skeleton className="h-7 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Non-authenticated view
  if (!user) {
    return (
      <div className="container mx-auto py-10 flex flex-col items-center justify-center min-h-[50vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Teams Collaboration
            </CardTitle>
            <CardDescription>
              Create and manage teams to collaborate on TikTok analysis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Sign in to create teams and collaborate with others on TikTok content analysis.
              Teams allow you to share insights and work together on improving your content strategy.
            </p>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              asChild
            >
              <Link href="/auth/login?redirectTo=/teams">
                Login to Access Teams
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Card className="bg-destructive/10">
          <CardHeader>
            <CardTitle>Error Loading Teams</CardTitle>
            <CardDescription>Something went wrong while fetching your teams.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{error}</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Teams</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
              <DialogDescription>
                Create a team to collaborate with others.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="team-name">Team Name</Label>
                <Input
                  id="team-name"
                  placeholder="Enter team name"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="team-description">Description (Optional)</Label>
                <Textarea
                  id="team-description"
                  placeholder="Briefly describe your team"
                  rows={3}
                  value={newTeamDescription}
                  onChange={(e) => setNewTeamDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateTeam}
                disabled={!newTeamName.trim() || isCreating}
              >
                {isCreating ? 'Creating...' : 'Create Team'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {teams.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Teams Yet</CardTitle>
            <CardDescription>Create your first team to get started.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Teams help you organize your work and collaborate with others.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Team
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team: any) => (
            <Card key={team.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">{team.name}</CardTitle>
                <CardDescription>
                  {team.role === 'owner' ? 'Owner' : team.role === 'admin' ? 'Admin' : 'Member'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {team.description || 'No description provided.'}
                </p>
              </CardContent>
              <CardFooter className="border-t pt-4 pb-2">
                <Button asChild className="w-full">
                  <Link href={`/teams/${team.id}`}>
                    <Users className="mr-2 h-4 w-4" />
                    Manage Team
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 