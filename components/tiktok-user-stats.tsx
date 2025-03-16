"use client"

import { useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, PlusCircle, List, ListChecks, LineChart as LineChartIcon, BarChart as BarChartIcon, Loader2, RefreshCw, MoreVertical, FolderPlus, Check, MoreHorizontal, UserMinus, UserPlus, PencilIcon, Trash2Icon } from "lucide-react"
import { calculateUserAnalytics } from '@/lib/analytics-service'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

type TikTokProfile = {
  profileData: {
    data: {
      data: {
        user: {
          id: string
          uniqueId: string
          nickname: string
          avatarThumb: string
          signature: string
          verified: boolean
        }
        stats: {
          followerCount: number
          followingCount: number
          heart: number
          videoCount: number
        }
      }
    }
  }
  postsData: {
    data: {
      data: {
        videos: any[]
      }
    }
  }
}

type TikTokGroup = {
  id: string
  name: string
  tiktok_group_members: { username: string }[]
}

type TikTokProfiles = { [key: string]: TikTokProfile }

type TimeFrame = '7d' | '14d' | '30d' | '10w'

const ViewsTrendChart: React.FC<{ data: any }> = ({ data }) => (
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data}>
      <Line
        type="monotone"
        dataKey="views"
        stroke="#22c55e"
        strokeWidth={1.5}
        dot={false}
      />
    </LineChart>
  </ResponsiveContainer>
)

const formatTimeToPost = (time: number) => {
  if (time < 60) return `${Math.round(time)}m`
  if (time < 1440) return `${Math.round(time / 60)}h`
  return `${Math.round(time / 1440)}d`
}

export default function TikTokUserStats() {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profiles, setProfiles] = useState<TikTokProfiles>({})
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'add' | string>('add')
  const [analytics, setAnalytics] = useState<{ [key: string]: any }>({})
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState<{ [key: string]: boolean }>({})
  const [groups, setGroups] = useState<TikTokGroup[]>([])
  const [showGroupInput, setShowGroupInput] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('10w')
  const [isLoadingGroups, setIsLoadingGroups] = useState(false)
  const [editingGroup, setEditingGroup] = useState<TikTokGroup | null>(null)
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false)

  // Load all stored profiles from Supabase on mount
  useEffect(() => {
    const loadStoredProfiles = async () => {
      try {
        console.log('Loading stored profiles from Supabase...')
        const response = await fetch('/api/tiktok/profiles')

        if (!response.ok) {
          throw new Error('Failed to fetch stored profiles')
        }

        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch stored profiles')
        }

        // Transform the data into our expected format
        const transformedProfiles = data.data.reduce((acc: { [key: string]: TikTokProfile }, profile: any) => {
          const { user, posts } = profile
          acc[user.username] = {
            profileData: {
              data: {
                data: {
                  user: {
                    id: user.user_id,
                    uniqueId: user.username,
                    nickname: user.nickname,
                    avatarThumb: user.avatar,
                    signature: user.bio,
                    verified: user.verified
                  },
                  stats: {
                    followerCount: user.followers,
                    followingCount: user.following,
                    heart: user.likes,
                    videoCount: user.videos
                  }
                }
              }
            },
            postsData: {
              data: {
                data: {
                  videos: posts || []
                }
              }
            }
          }
          return acc
        }, {})

        console.log('Loaded profiles:', Object.keys(transformedProfiles))
        setProfiles(transformedProfiles)

        // Set the active tab based on whether there are profiles
        if (Object.keys(transformedProfiles).length > 0) {
          setActiveTab('all')
        } else {
          setActiveTab('add')
        }

        // Calculate analytics for each profile
        Object.keys(transformedProfiles).forEach(username => {
          calculateUserAnalytics(username)
            .then(analyticsData => {
              setAnalytics(prev => ({
                ...prev,
                [username]: analyticsData
              }))
            })
            .catch(console.error)
        })

      } catch (error) {
        console.error('Error loading stored profiles:', error)
      } finally {
        setIsInitialLoading(false)
      }
    }

    loadStoredProfiles()
  }, [])

  // Load groups from database on mount
  useEffect(() => {
    const loadGroups = async () => {
      try {
        setIsLoadingGroups(true)
        const response = await fetch('/api/tiktok/groups')

        if (!response.ok) {
          throw new Error(`Failed to fetch groups: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch groups')
        }

        setGroups(data.data || [])
      } catch (error) {
        console.error('Error loading groups:', error)
        // Don't set error state, just log it and continue with empty groups
        setGroups([])
      } finally {
        setIsLoadingGroups(false)
      }
    }

    loadGroups()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim()) {
      setError('Please enter a TikTok username or user ID')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const userResponse = await fetch('/api/tiktok/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileUrl: input }),
      })

      if (!userResponse.ok) {
        const userData = await userResponse.json()
        throw new Error(userData.error || 'Failed to fetch user data')
      }

      const userData = await userResponse.json()
      const username = userData.data.data.user.uniqueId

      // Check if we already have this profile
      const existingProfile = profiles[username]

      // Always fetch stored data from Supabase
      const supabasePostsResponse = await fetch(`/api/tiktok/posts/${username}`)
      if (!supabasePostsResponse.ok) {
        const errorData = await supabasePostsResponse.json()
        throw new Error(errorData.error || 'Failed to fetch stored posts')
      }

      const supabasePosts = await supabasePostsResponse.json()

      // Update profiles state
      setProfiles(prev => ({
        ...prev,
        [username]: {
          ...existingProfile,
          profileData: userData,
          postsData: {
            data: {
              data: {
                videos: supabasePosts.data || []
              }
            }
          }
        }
      }))

      // Only switch to the profile tab if it's a new profile
      if (!existingProfile) {
        setActiveTab(username)
      }

      setInput('')

    } catch (error) {
      console.error('Error fetching data:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async (username: string) => {
    if (refreshing[username]) return

    setRefreshing(prev => ({ ...prev, [username]: true }))
    setError(null)

    try {
      console.log('=== Starting Profile Refresh ===')
      console.log(`Refreshing profile for username: ${username}`)

      // Get the user ID from the existing profile data
      const userId = profiles[username]?.profileData?.data?.data?.user?.id
      if (!userId) {
        throw new Error('User ID not found in profile data')
      }

      // Step 1: Fetch fresh user data from TikTok API using user ID
      console.log('1. Fetching fresh user data from TikTok API...')
      const userResponse = await fetch('/api/tiktok/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileUrl: userId,
          forceRefresh: true
        }),
      })

      if (!userResponse.ok) {
        const errorData = await userResponse.json()
        console.error('Failed to fetch user data:', errorData)
        throw new Error(errorData.error || 'Failed to refresh user data')
      }

      const userData = await userResponse.json()
      console.log('User data fetched:', userData)

      // Step 2: Fetch fresh posts from TikTok API using user ID
      console.log('2. Fetching fresh posts from TikTok API...')
      const postsResponse = await fetch('/api/tiktok/user/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileUrl: userId,
          count: 10,
          cursor: '0',
          forceRefresh: true
        }),
      })

      if (!postsResponse.ok) {
        const errorData = await postsResponse.json()
        console.error('Failed to fetch posts:', errorData)
        throw new Error(errorData.error || 'Failed to fetch posts')
      }

      // Step 3: Fetch updated data from Supabase to ensure we have the latest
      console.log('3. Fetching updated data from Supabase...')
      const supabasePostsResponse = await fetch(`/api/tiktok/posts/${username}`)
      if (!supabasePostsResponse.ok) {
        const errorData = await supabasePostsResponse.json()
        console.error('Failed to fetch Supabase posts:', errorData)
        throw new Error(errorData.error || 'Failed to fetch updated posts')
      }

      const supabasePosts = await supabasePostsResponse.json()

      // Step 4: Update local state with new data
      setProfiles(prev => {
        const updatedProfile = {
          ...prev,
          [username]: {
            ...prev[username],
            profileData: userData,
            postsData: { data: { data: { videos: supabasePosts.data } } }
          }
        }
        return updatedProfile
      })

      // Step 5: Recalculate analytics with fresh data
      console.log('5. Recalculating analytics...')
      const newAnalytics = await calculateUserAnalytics(username)
      setAnalytics(prev => ({
        ...prev,
        [username]: newAnalytics
      }))

      console.log('=== Profile Refresh Completed Successfully ===')

    } catch (error) {
      console.error('=== Profile Refresh Failed ===')
      console.error('Error details:', error)
      setError(error instanceof Error ? error.message : 'Failed to refresh profile')
    } finally {
      setRefreshing(prev => ({ ...prev, [username]: false }))
    }
  }

  const formatNumber = (num: number) => {
    if (!num) return '0'
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const formatDate = (date: string | number) => {
    if (!date) return 'Unknown date'
    const dateObj = typeof date === 'number' ? new Date(date * 1000) : new Date(date)
    return dateObj.toLocaleDateString()
  }

  // Modify handleCreateGroup to use the database
  const handleCreateGroup = async () => {
    try {
      const response = await fetch('/api/tiktok/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: newGroupName,
          usernames: selectedUsers
        })
      })

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error)
      }

      // Update local state
      setGroups(prevGroups => [
        ...prevGroups,
        {
          id: data.data.id,
          name: newGroupName,
          tiktok_group_members: selectedUsers.map(username => ({ username })),
        },
      ])

      // Reset form
      setNewGroupName('')
      setSelectedUsers([])
      setShowGroupInput(false)
    } catch (error) {
      console.error('Error creating group:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create group')
    }
  }

  // Function to toggle user selection
  const toggleUserSelection = (username: string) => {
    setSelectedUsers(prev =>
      prev.includes(username)
        ? prev.filter(u => u !== username)
        : [...prev, username]
    )
  }

  // Modify handleAddToGroup to use the database
  const handleAddToGroup = async (username: string, groupId: string) => {
    try {
      const response = await fetch('/api/tiktok/groups/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          group_id: groupId,
          username
        })
      })

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error)
      }

      // Update local state
      setGroups(prevGroups => prevGroups.map(group =>
        group.id === groupId
          ? {
            ...group,
            tiktok_group_members: [...group.tiktok_group_members, { username }]
          }
          : group
      ))
    } catch (error) {
      console.error('Error adding to group:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add to group')
    }
  }

  // Modify handleRemoveFromGroup to use the database
  const handleRemoveFromGroup = async (username: string, groupId: string) => {
    try {
      const response = await fetch('/api/tiktok/groups/members', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          group_id: groupId,
          username
        })
      })

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error)
      }

      // Update local state
      setGroups(prevGroups => prevGroups.map(group =>
        group.id === groupId
          ? {
            ...group,
            tiktok_group_members: group.tiktok_group_members.filter(m => m.username !== username)
          }
          : group
      ))
    } catch (error) {
      console.error('Error removing from group:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to remove from group')
    }
  }

  // Function to filter data based on timeframe
  const filterDataByTimeFrame = (data: any[], timeFrame: TimeFrame) => {
    if (!data) return []
    const now = new Date()
    const cutoff = new Date()

    switch (timeFrame) {
      case '7d':
        cutoff.setDate(now.getDate() - 7)
        break
      case '14d':
        cutoff.setDate(now.getDate() - 14)
        break
      case '30d':
        cutoff.setDate(now.getDate() - 30)
        break
      case '10w':
        cutoff.setDate(now.getDate() - 70) // 10 weeks
        break
    }

    return data.filter(item => new Date(item.date || item.week) >= cutoff)
  }

  // Function to calculate metrics for a specific timeframe
  const calculateTimeFrameMetrics = (username: string, timeFrame: TimeFrame) => {
    if (!analytics[username]) return null

    const now = new Date()
    const cutoff = new Date()

    switch (timeFrame) {
      case '7d': cutoff.setDate(now.getDate() - 7); break
      case '14d': cutoff.setDate(now.getDate() - 14); break
      case '30d': cutoff.setDate(now.getDate() - 30); break
      case '10w': cutoff.setDate(now.getDate() - 70); break
    }

    // Filter posts within the timeframe
    const postsInTimeframe = (profiles[username]?.postsData?.data?.data?.videos || [])
      .filter((post: any) => new Date(post.created_at) >= cutoff)

    // Calculate metrics
    const totalViews = postsInTimeframe.reduce((sum: number, post: any) => sum + (parseInt(post.plays) || 0), 0)
    const avgViewsPerPost = postsInTimeframe.length > 0 ? Math.round(totalViews / postsInTimeframe.length) : 0

    // Calculate average time between posts
    let avgTimeBetweenPosts = 0
    if (postsInTimeframe.length > 1) {
      const sortedPosts = [...postsInTimeframe].sort((a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      let totalHours = 0
      for (let i = 0; i < sortedPosts.length - 1; i++) {
        const timeDiff = new Date(sortedPosts[i].created_at).getTime() - new Date(sortedPosts[i + 1].created_at).getTime()
        totalHours += timeDiff / (1000 * 60 * 60)
      }
      avgTimeBetweenPosts = totalHours / (sortedPosts.length - 1)
    }

    // Calculate post frequency (posts per week)
    const timeframeInWeeks = (now.getTime() - cutoff.getTime()) / (1000 * 60 * 60 * 24 * 7)
    const postsPerWeek = postsInTimeframe.length / timeframeInWeeks

    return {
      totalViews,
      avgViewsPerPost,
      avgTimeBetweenPosts,
      postsPerWeek,
      postCount: postsInTimeframe.length
    }
  }

  // Modify the metrics display to use timeframe calculations
  const renderMetrics = (username: string, timeFrame: TimeFrame) => {
    const metrics = calculateTimeFrameMetrics(username, timeFrame)
    if (!metrics) return null

    return {
      avgViewsPerPost: formatNumber(metrics.avgViewsPerPost),
      avgTimeBetweenPosts: `${Math.round(metrics.avgTimeBetweenPosts)}h`,
      postsPerWeek: metrics.postsPerWeek.toFixed(1),
      totalViews: formatNumber(metrics.totalViews),
      postCount: metrics.postCount
    }
  }

  // Modify handleEditGroup to use the database
  const handleEditGroup = (group: TikTokGroup) => {
    setEditingGroup(group)
    setNewGroupName(group.name)
    setSelectedUsers(group.tiktok_group_members.map(member => member.username))
    setShowGroupInput(true)
  }

  // Modify handleDeleteGroup to use the database
  const handleDeleteGroup = async (group: TikTokGroup) => {
    try {
      const response = await fetch('/api/tiktok/groups', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ id: group.id })
      })

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error)
      }

      // Update local state
      setGroups(prevGroups => prevGroups.filter(g => g.id !== group.id))
      setSelectedGroup(null)
    } catch (error) {
      console.error('Error deleting group:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete group')
    }
  }

  // Modify handleUpdateGroup to use the database
  const handleUpdateGroup = async () => {
    if (!editingGroup) return

    try {
      const response = await fetch('/api/tiktok/groups', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          id: editingGroup.id,
          name: newGroupName,
          usernames: selectedUsers
        })
      })

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error)
      }

      // Update local state
      setGroups(prevGroups => prevGroups.map((group: TikTokGroup) =>
        group.id === editingGroup.id
          ? {
            ...group,
            name: newGroupName,
            tiktok_group_members: selectedUsers.map(username => ({ username }))
          }
          : group
      ))

      // Reset form
      setNewGroupName('')
      setSelectedUsers([])
      setEditingGroup(null)
      setShowGroupInput(false)
    } catch (error) {
      console.error('Error updating group:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update group')
    }
  }

  // Modify handleToggleGroupMember to use the database
  const handleToggleGroupMember = async (username: string, groupId: string) => {
    try {
      const group = groups.find(g => g.id === groupId)
      if (!group) {
        throw new Error('Group not found')
      }

      const isAdding = !group.tiktok_group_members.some(m => m.username === username)

      // Add or remove member from group
      const response = await fetch('/api/tiktok/groups/members', {
        method: isAdding ? 'POST' : 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          group_id: groupId,
          username
        })
      })

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error)
      }

      // Update local state
      setGroups(prevGroups => prevGroups.map(g =>
        g.id === groupId
          ? {
            ...g,
            tiktok_group_members: isAdding
              ? [...g.tiktok_group_members, { username }]
              : g.tiktok_group_members.filter(m => m.username !== username)
          }
          : g
      ))
    } catch (error) {
      console.error('Error toggling group member:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update group member')
    }
  }

  return (
    <div className="min-h-screen">
      {/* Tabs */}
      <div className="relative z-50">
        <div className="px-6 py-3 flex items-start gap-6">
          <button
            onClick={() => setActiveTab('add')}
            className="flex flex-col items-center gap-2"
          >
            <div className={`h-12 w-12 flex items-center justify-center rounded-full ${activeTab === 'add'
              ? 'bg-foreground'
              : 'border border-foreground/30'
              }`}>
              <Plus className={`w-6 h-6 ${activeTab === 'add'
                ? 'stroke-background'
                : 'stroke-foreground/50'
                }`} />
            </div>
            <span className={`text-xs ${activeTab === 'add'
              ? 'text-foreground'
              : 'text-muted-foreground'
              }`}>Add</span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className="flex flex-col items-center gap-2"
          >
            <div className={`h-12 w-12 flex items-center justify-center rounded-full ${activeTab === 'all'
              ? 'bg-foreground'
              : 'border border-foreground/30'
              }`}>
              <List className={`w-6 h-6 ${activeTab === 'all'
                ? 'stroke-background'
                : 'stroke-foreground/50'
                }`} />
            </div>
            <span className={`text-xs ${activeTab === 'all'
              ? 'text-foreground'
              : 'text-muted-foreground'
              }`}>All</span>
          </button>

          {Object.entries(profiles).map(([username, data]) => (
            <button
              key={username}
              onClick={() => setActiveTab(username)}
              className="flex flex-col items-center gap-2"
            >
              <div className={`h-12 w-12 rounded-full overflow-hidden ${activeTab === username ? 'opacity-100' : 'opacity-40'
                }`}>
                <img
                  src={data.profileData.data.data.user.avatarThumb}
                  alt={username}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className={`text-xs ${activeTab === username
                ? 'text-foreground'
                : 'text-muted-foreground'
                }`}>{username}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 py-8 relative z-40">
        {isInitialLoading ? (
          <div className="max-w-full">
            <div className="flex items-center space-x-4 mb-8">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[150px]" />
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-[200px] w-full" />
              <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-[100px]" />
                <Skeleton className="h-[100px]" />
                <Skeleton className="h-[100px]" />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Add Profile Form */}
            {activeTab === 'add' && (
              <div className="max-w-2xl relative z-40">
                <form onSubmit={handleSubmit} className="flex gap-4">
                  <Input
                    placeholder="Enter TikTok username or user ID (e.g., @username)"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    required
                    className="h-10"
                    disabled={isLoading}
                  />
                  <Button type="submit" disabled={isLoading} className="h-10 relative z-50">
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading...
                      </div>
                    ) : (
                      "Add Profile"
                    )}
                  </Button>
                </form>

                {error && (
                  <Alert className="mt-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Dialog for group creation/editing */}
            <Dialog open={showGroupInput || editingGroup !== null} onOpenChange={(open) => {
              if (!open) {
                setShowGroupInput(false)
                setEditingGroup(null)
                setNewGroupName('')
                setSelectedUsers([])
              }
            }}>
              <DialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[90vw] max-w-[500px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingGroup ? 'Edit Group' : 'Create New Group'}</DialogTitle>
                  <DialogDescription>
                    {editingGroup ? 'Edit group name and manage members.' : 'Enter a group name and select the profiles you want to include.'}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label htmlFor="groupName" className="text-sm font-medium">
                      Group Name
                    </label>
                    <Input
                      id="groupName"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="Enter group name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Select Profiles
                    </label>
                    <div className="border rounded-lg divide-y max-h-[300px] overflow-y-auto">
                      {Object.entries(profiles).map(([username, profile]: [string, TikTokProfile]) => {
                        const isSelected = selectedUsers.includes(username)
                        const isInOtherGroup = groups.some(g =>
                          g.id !== editingGroup?.id &&
                          g.tiktok_group_members.some(m => m.username === username)
                        )

                        if (isInOtherGroup && !isSelected) return null

                        return (
                          <div key={username} className="flex items-center space-x-2 p-2">
                            <Checkbox
                              id={username}
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedUsers(prev => [...prev, username])
                                } else {
                                  setSelectedUsers(prev => prev.filter(u => u !== username))
                                }
                              }}
                            />
                            <Label htmlFor={username}>{username}</Label>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowGroupInput(false)
                      setEditingGroup(null)
                      setNewGroupName('')
                      setSelectedUsers([])
                    }}
                    className="relative z-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => editingGroup ? handleUpdateGroup() : handleCreateGroup()}
                    disabled={editingGroup ? !newGroupName.trim() : (!newGroupName.trim() || selectedUsers.length === 0)}
                    className="relative z-50"
                  >
                    {editingGroup ? 'Update Group' : 'Create Group'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* All Profiles View */}
            {activeTab === 'all' && (
              <div className="space-y-8">
                <div className="mb-6 flex justify-between items-center">
                  <Button onClick={() => setShowGroupInput(true)} className="h-10">
                    Create Group
                  </Button>
                  <div className="flex gap-2">
                    {[
                      { value: '7d', label: '7 Days' },
                      { value: '14d', label: '14 Days' },
                      { value: '30d', label: '30 Days' },
                      { value: '10w', label: '10 Weeks' },
                    ].map((option) => (
                      <Button
                        key={option.value}
                        variant={timeFrame === option.value ? 'default' : 'outline'}
                        onClick={() => setTimeFrame(option.value as TimeFrame)}
                        className="h-10"
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Groups */}
                {groups.map((group) => (
                  <div key={group.id} className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold">{group.name}</h2>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditGroup(group)}>
                            <PencilIcon className="mr-2 h-4 w-4" />
                            Edit group
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteGroup(group)} className="text-destructive">
                            <Trash2Icon className="mr-2 h-4 w-4" />
                            Delete group
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="relative overflow-x-auto rounded-lg border">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-4 font-medium">Profile</th>
                            <th className="text-right p-4 font-medium w-[100px]">Followers</th>
                            <th className="text-right p-4 font-medium w-[100px]">Following</th>
                            <th className="text-center p-4 font-medium w-[140px]">Views Trend</th>
                            <th className="text-right p-4 font-medium w-[120px]">Ø views p. post</th>
                            <th className="text-center p-4 font-medium w-[140px]">Post Frequency</th>
                            <th className="text-right p-4 font-medium w-[100px]">Ø time to post</th>
                            <th className="w-[60px]"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.tiktok_group_members.map((member) => {
                            const profile = profiles[member.username]
                            if (!profile) return null
                            return (
                              <tr key={member.username} className="border-t hover:bg-muted/50">
                                <td className="p-4">
                                  <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full overflow-hidden">
                                      <img
                                        src={profile.profileData.data.data.user.avatarThumb}
                                        alt={member.username}
                                        className="h-full w-full object-cover"
                                      />
                                    </div>
                                    <div>
                                      <div className="font-medium">
                                        {profile.profileData.data.data.user.nickname}
                                      </div>
                                      <div className="text-muted-foreground">@{member.username}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4 text-right">
                                  {formatNumber(profile.profileData.data.data.stats.followerCount)}
                                </td>
                                <td className="p-4 text-right">
                                  {formatNumber(profile.profileData.data.data.stats.followingCount)}
                                </td>
                                <td className="p-4">
                                  <div className="h-[40px]">
                                    {analytics[member.username] && (
                                      <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={filterDataByTimeFrame(analytics[member.username].viewsTrend, timeFrame)}>
                                          <Line
                                            type="monotone"
                                            dataKey="views"
                                            stroke="#22c55e"
                                            strokeWidth={1.5}
                                            dot={false}
                                          />
                                          <Tooltip
                                            content={({ active, payload }) => {
                                              if (active && payload && payload.length) {
                                                return (
                                                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                    <div className="text-xs text-muted-foreground">
                                                      {new Date(payload[0].payload.date).toLocaleDateString()}
                                                    </div>
                                                    <div className="font-medium">
                                                      {formatNumber(Number(payload[0].value))} views
                                                    </div>
                                                  </div>
                                                )
                                              }
                                              return null
                                            }}
                                          />
                                        </LineChart>
                                      </ResponsiveContainer>
                                    )}
                                  </div>
                                </td>
                                <td className="p-4 text-right">
                                  {renderMetrics(member.username, timeFrame)?.avgViewsPerPost || '0'}
                                </td>
                                <td className="p-4">
                                  <div className="h-[40px]">
                                    {analytics[member.username] && (
                                      <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={filterDataByTimeFrame(analytics[member.username].weeklyPostFrequency, timeFrame)} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                                          <Bar
                                            dataKey="count"
                                            fill="#3b82f6"
                                            opacity={0.9}
                                            radius={[2, 2, 0, 0]}
                                            maxBarSize={6}
                                          />
                                          <Tooltip
                                            content={({ active, payload }) => {
                                              if (active && payload && payload.length) {
                                                return (
                                                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                    <div className="text-xs text-muted-foreground">
                                                      Week of {new Date(payload[0].payload.week).toLocaleDateString()}
                                                    </div>
                                                    <div className="font-medium">
                                                      {payload[0].value} posts
                                                    </div>
                                                  </div>
                                                )
                                              }
                                              return null
                                            }}
                                          />
                                        </BarChart>
                                      </ResponsiveContainer>
                                    )}
                                  </div>
                                </td>
                                <td className="p-4 text-right">
                                  {renderMetrics(member.username, timeFrame)?.avgTimeBetweenPosts || '0h'}
                                </td>
                                <td className="p-4">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className="h-8 w-8 p-0 relative z-50">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-[160px] relative z-50">
                                      <DropdownMenuItem onClick={() => handleRefresh(member.username)}>
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Refresh
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleRemoveFromGroup(member.username, group.id)}>
                                        <UserMinus className="mr-2 h-4 w-4" />
                                        Remove from group
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))},

                {/* Ungrouped Profiles */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">Ungrouped</h3>
                  <div className="relative overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-4 font-medium">Profile</th>
                          <th className="text-right p-4 font-medium w-[100px]">Followers</th>
                          <th className="text-right p-4 font-medium w-[100px]">Following</th>
                          <th className="text-center p-4 font-medium w-[140px]">Views Trend</th>
                          <th className="text-right p-4 font-medium w-[120px]">Ø views p. post</th>
                          <th className="text-center p-4 font-medium w-[140px]">Post Frequency</th>
                          <th className="text-right p-4 font-medium w-[100px]">Ø time to post</th>
                          <th className="w-[60px]"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(profiles)
                          .filter(([username]) => !groups.some(g => g.tiktok_group_members.some(m => m.username === username)))
                          .map(([username, profile]: [string, TikTokProfile]) => (
                            <tr key={username} className="border-t hover:bg-muted/50">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-full overflow-hidden">
                                    <img
                                      src={profile.profileData.data.data.user.avatarThumb}
                                      alt={username}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                  <div>
                                    <div className="font-medium">
                                      {profile.profileData.data.data.user.nickname}
                                    </div>
                                    <div className="text-muted-foreground">@{username}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 text-right">
                                {formatNumber(profile.profileData.data.data.stats.followerCount)}
                              </td>
                              <td className="p-4 text-right">
                                {formatNumber(profile.profileData.data.data.stats.followingCount)}
                              </td>
                              <td className="p-4">
                                <div className="h-[40px]">
                                  {analytics[username] && (
                                    <ResponsiveContainer width="100%" height="100%">
                                      <LineChart data={filterDataByTimeFrame(analytics[username].viewsTrend, timeFrame)}>
                                        <Line
                                          type="monotone"
                                          dataKey="views"
                                          stroke="#22c55e"
                                          strokeWidth={1.5}
                                          dot={false}
                                        />
                                        <Tooltip
                                          content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                              return (
                                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                  <div className="text-xs text-muted-foreground">
                                                    {new Date(payload[0].payload.date).toLocaleDateString()}
                                                  </div>
                                                  <div className="font-medium">
                                                    {formatNumber(Number(payload[0].value))} views
                                                  </div>
                                                </div>
                                              )
                                            }
                                            return null
                                          }}
                                        />
                                      </LineChart>
                                    </ResponsiveContainer>
                                  )}
                                </div>
                              </td>
                              <td className="p-4 text-right">
                                {renderMetrics(username, timeFrame)?.avgViewsPerPost || '0'}
                              </td>
                              <td className="p-4">
                                <div className="h-[40px]">
                                  {analytics[username] && (
                                    <ResponsiveContainer width="100%" height="100%">
                                      <BarChart data={filterDataByTimeFrame(analytics[username].weeklyPostFrequency, timeFrame)} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                                        <Bar
                                          dataKey="count"
                                          fill="#3b82f6"
                                          opacity={0.9}
                                          radius={[2, 2, 0, 0]}
                                          maxBarSize={6}
                                        />
                                        <Tooltip
                                          content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                              return (
                                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                  <div className="text-xs text-muted-foreground">
                                                    Week of {new Date(payload[0].payload.week).toLocaleDateString()}
                                                  </div>
                                                  <div className="font-medium">
                                                    {payload[0].value} posts
                                                  </div>
                                                </div>
                                              )
                                            }
                                            return null
                                          }}
                                        />
                                      </BarChart>
                                    </ResponsiveContainer>
                                  )}
                                </div>
                              </td>
                              <td className="p-4 text-right">
                                {renderMetrics(username, timeFrame)?.avgTimeBetweenPosts || '0h'}
                              </td>
                              <td className="p-4">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0 relative z-50">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-[200px] relative z-50">
                                    <DropdownMenuItem onClick={() => handleRefresh(username)}>
                                      <RefreshCw className="mr-2 h-4 w-4" />
                                      Refresh
                                    </DropdownMenuItem>
                                    <DropdownMenuSub>
                                      <DropdownMenuSubTrigger className="relative z-50">
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Add to group
                                      </DropdownMenuSubTrigger>
                                      <DropdownMenuSubContent className="relative z-50">
                                        {groups.map((group) => (
                                          <DropdownMenuItem
                                            key={group.id}
                                            onClick={() => handleAddToGroup(username, group.id)}
                                          >
                                            {group.name}
                                          </DropdownMenuItem>
                                        ))}
                                      </DropdownMenuSubContent>
                                    </DropdownMenuSub>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Card */}
            {activeTab !== 'all' && activeTab !== 'add' && profiles[activeTab] && (
              <div className="max-w-full space-y-6">
                <div className="flex justify-end pr-2">
                  <p className="text-sm text-muted-foreground">
                    Trends for the past <span className="text-foreground font-medium">10 weeks</span>
                  </p>
                </div>
                {/* Profile Header */}
                <div className="p-8 rounded-2xl border bg-background shadow-sm">
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex items-start gap-8">
                      <img
                        src={profiles[activeTab].profileData.data.data.user.avatarThumb}
                        alt={profiles[activeTab].profileData.data.data.user.nickname}
                        className="w-20 h-20 rounded-full"
                      />
                      <div>
                        <h2 className="text-2xl font-semibold">
                          {profiles[activeTab].profileData.data.data.user.nickname}
                        </h2>
                        <p className="text-base text-muted-foreground">@{profiles[activeTab].profileData.data.data.user.uniqueId}</p>
                        {profiles[activeTab].profileData.data.data.user.signature && (
                          <p className="mt-3 text-base text-muted-foreground">
                            {profiles[activeTab].profileData.data.data.user.signature}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handleRefresh(activeTab)}
                      disabled={refreshing[activeTab]}
                    >
                      {refreshing[activeTab] ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Refresh Profile
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-x-16 gap-y-8">
                    <div>
                      <p className="text-base font-medium">Followers</p>
                      <p className="text-2xl font-semibold mt-1">
                        {formatNumber(profiles[activeTab].profileData.data.data.stats.followerCount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-base font-medium">Following</p>
                      <p className="text-2xl font-semibold mt-1">
                        {formatNumber(profiles[activeTab].profileData.data.data.stats.followingCount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-base font-medium">
                        <span className="inline-flex items-center gap-2">
                          <LineChartIcon className="w-4 h-4" />
                          ViewsTrend
                        </span>
                      </p>
                      <div className="h-9 mt-1">
                        {analytics[activeTab]?.viewsTrend && (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={filterDataByTimeFrame(analytics[activeTab].viewsTrend, timeFrame)}>
                              <Line
                                type="monotone"
                                dataKey="views"
                                stroke="#22c55e"
                                strokeWidth={1.5}
                                dot={false}
                              />
                              <Tooltip
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    return (
                                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                                        <div className="text-xs text-muted-foreground">
                                          {new Date(payload[0].payload.date).toLocaleDateString()}
                                        </div>
                                        <div className="font-medium">
                                          {formatNumber(Number(payload[0].value))} views
                                        </div>
                                      </div>
                                    )
                                  }
                                  return null
                                }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-base font-medium">Ø views p. post</p>
                      <p className="text-2xl font-semibold mt-1">
                        {renderMetrics(activeTab, timeFrame)?.avgViewsPerPost || '...'}
                      </p>
                    </div>
                    <div>
                      <p className="text-base font-medium">
                        <span className="inline-flex items-center gap-2">
                          <BarChartIcon className="w-4 h-4" />
                          Post Frequency
                        </span>
                      </p>
                      <div className="h-9 mt-1">
                        {analytics[activeTab]?.weeklyPostFrequency && (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={filterDataByTimeFrame(analytics[activeTab].weeklyPostFrequency, timeFrame)} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                              <Bar
                                dataKey="count"
                                fill="#3b82f6"
                                opacity={0.9}
                                radius={[2, 2, 0, 0]}
                                maxBarSize={6}
                              />
                              <Tooltip
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    return (
                                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                                        <div className="text-xs text-muted-foreground">
                                          Week of {new Date(payload[0].payload.week).toLocaleDateString()}
                                        </div>
                                        <div className="font-medium">
                                          {payload[0].value} posts
                                        </div>
                                      </div>
                                    )
                                  }
                                  return null
                                }}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-base font-medium">Ø time to post</p>
                      <p className="text-2xl font-semibold mt-1">
                        {renderMetrics(activeTab, timeFrame)?.avgTimeBetweenPosts || '...'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recent Posts */}
                {profiles[activeTab].postsData?.data?.data?.videos?.length > 0 && (
                  <div className="mt-6">
                    <h2 className="text-base font-medium mb-4">Recent Posts</h2>
                    <div className="space-y-3">
                      {profiles[activeTab].postsData.data.data.videos.map((post: any) => (
                        <div key={post.id} className="flex gap-4 p-4 rounded-lg border bg-background">
                          {post.video_cover_url && (
                            <img
                              src={post.video_cover_url}
                              alt={post.description || 'Video thumbnail'}
                              className="w-24 h-24 object-cover rounded-md flex-none"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm line-clamp-2 mb-2">{post.description || 'No description'}</p>
                            <p className="text-xs text-muted-foreground mb-3">
                              Posted on {formatDate(post.created_at)}
                            </p>
                            <div className="grid grid-cols-4 gap-4">
                              <div>
                                <p className="font-medium text-sm">{formatNumber(post.plays || 0)}</p>
                                <p className="text-xs text-muted-foreground">Views</p>
                              </div>
                              <div>
                                <p className="font-medium text-sm">{formatNumber(post.likes || 0)}</p>
                                <p className="text-xs text-muted-foreground">Likes</p>
                              </div>
                              <div>
                                <p className="font-medium text-sm">{formatNumber(post.comments || 0)}</p>
                                <p className="text-xs text-muted-foreground">Comments</p>
                              </div>
                              <div>
                                <p className="font-medium text-sm">{formatNumber(post.shares || 0)}</p>
                                <p className="text-xs text-muted-foreground">Shares</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

