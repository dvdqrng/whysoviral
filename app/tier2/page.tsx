"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth-context'
import { Button } from "../components/ui/button"
import { Table, TableHeader, TableBody, TableCell, TableHead, TableRow } from "../components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend, AreaChart, Area, Cell } from 'recharts'
import { LayoutGrid, List as ListIcon, RefreshCw, Plus, CheckCircle } from 'lucide-react'
import { AddAccountDialog } from "../components/add-account-dialog"
import { AllAccountsView } from "./components/AllAccountsView"
import { AccountAnalyticsView } from "./components/AccountAnalyticsView"
import { AccountsHeader } from "../components/AccountsHeader"
// import { AddAccountAuthTest } from "@/components/add-account-auth-test"

export default function Tier2Page() {
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [viewMode, setViewMode] = useState<'tiles' | 'list'>('list')
  const [refreshing, setRefreshing] = useState(false)
  const [lastFetched, setLastFetched] = useState<Date | null>(null)
  const [timeframe, setTimeframe] = useState<1 | 3 | 6 | 12>(1) // Default to 1 month
  const [postsDisplayLimit, setPostsDisplayLimit] = useState({ tiles: 12, list: 25 })
  const [addAccountDialogOpen, setAddAccountDialogOpen] = useState(false)
  const { user } = useAuth()

  // Function to fetch profiles
  const fetchProfiles = async () => {
    try {
      setLoading(true)
      // Pass the user ID directly as a query parameter
      const userId = user?.id

      console.log('Fetching profiles with userId:', userId, 'timeframe:', timeframe)

      // Directly call the fetch instead of using apiService
      const url = new URL('/api/tiktok/profiles', window.location.origin)
      if (userId) {
        url.searchParams.append('userId', userId)
      }
      url.searchParams.append('timeframe', timeframe.toString())

      const response = await fetch(url.toString())
      const data = await response.json()

      if (data.success && data.data) {
        setProfiles(data.data)
        setLastFetched(new Date(data.timestamp))
      } else {
        console.error('Failed to fetch profiles:', data.error)
      }
    } catch (error) {
      console.error('Error fetching profiles:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchProfiles()
    } else {
      setLoading(false)
    }
  }, [user, timeframe])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchProfiles()
  }

  const handleAddAccount = () => {
    setAddAccountDialogOpen(true)
  }

  const handleAddAccountSuccess = () => {
    fetchProfiles()
  }

  // Helper functions
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    } else {
      return num.toString()
    }
  }

  const getAverageViews = (profile: any): number => {
    if (!profile.posts || profile.posts.length === 0) return 0
    return profile.posts.reduce((sum: number, post: any) => sum + (post.plays || 0), 0) / profile.posts.length
  }

  const calculateEngagementRate = (profile: any): string => {
    if (!profile.posts || profile.posts.length === 0) return '0%'

    const totalEngagements = profile.posts.reduce((sum: number, post: any) => {
      return sum + (post.likes || 0) + (post.comments || 0) + (post.shares || 0)
    }, 0)

    const totalViews = profile.posts.reduce((sum: number, post: any) => sum + (post.plays || 0), 0)

    if (totalViews === 0) return '0%'

    const engagementRate = (totalEngagements / totalViews) * 100
    return `${engagementRate.toFixed(1)}%`
  }

  const getPostFrequency = (profile: any): string => {
    if (!profile.posts || profile.posts.length <= 1) return '-'

    // Calculate posts per week/month based on first and last post dates
    const sortedPosts = [...profile.posts].sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    const firstPostDate = new Date(sortedPosts[0].created_at)
    const lastPostDate = new Date(sortedPosts[sortedPosts.length - 1].created_at)

    const daysDiff = (lastPostDate.getTime() - firstPostDate.getTime()) / (1000 * 60 * 60 * 24)

    if (daysDiff < 1) return `${profile.posts.length} / day`

    const postsPerDay = profile.posts.length / daysDiff

    if (postsPerDay >= 1) {
      return `${postsPerDay.toFixed(1)} / day`
    } else {
      const postsPerWeek = postsPerDay * 7
      if (postsPerWeek >= 1) {
        return `${postsPerWeek.toFixed(1)} / week`
      } else {
        return `${(postsPerDay * 30).toFixed(1)} / month`
      }
    }
  }

  // Calculate contribution data for heatmap
  const getContributionData = (posts: any[]) => {
    if (!posts || posts.length === 0) {
      return { dates: [], maxCount: 0 }
    }

    // Create a map to store counts by date
    const dateCountMap = new Map()

    posts.forEach(post => {
      if (post.created_at) {
        const date = post.created_at.split('T')[0]
        dateCountMap.set(date, (dateCountMap.get(date) || 0) + 1)
      }
    })

    // Convert to array of objects for heatmap
    const dates = Array.from(dateCountMap.entries()).map(([date, count]) => ({
      date,
      count
    }))

    // Find the max count for color scaling
    const maxCount = Math.max(...Array.from(dateCountMap.values()), 1)

    return { dates, maxCount }
  }

  // Function to determine color based on count
  const getContributionColor = (count: number, maxCount: number) => {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-800'

    const intensity = Math.min(count / maxCount, 1)

    if (intensity < 0.2) return 'bg-green-100 dark:bg-green-900'
    if (intensity < 0.4) return 'bg-green-200 dark:bg-green-800'
    if (intensity < 0.6) return 'bg-green-300 dark:bg-green-700'
    if (intensity < 0.8) return 'bg-green-400 dark:bg-green-600'
    return 'bg-green-500 dark:bg-green-500'
  }

  // Get month labels based on timeframe
  const getTimeframeMonthLabels = () => {
    const currentDate = new Date()
    const months = []

    for (let i = timeframe - 1; i >= 0; i--) {
      const d = new Date()
      d.setMonth(currentDate.getMonth() - i)
      months.push(d.toLocaleString('default', { month: 'short' }))
    }

    return months
  }

  const activeProfile = profiles.find(profile => profile.user.username === activeTab)

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Page Header - Title and Timeframe Selector */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Account Analytics</h1>
        <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          <Button
            variant={timeframe === 1 ? "default" : "ghost"}
            size="sm"
            onClick={() => setTimeframe(1)}
            className="text-xs px-3"
          >
            1M
          </Button>
          <Button
            variant={timeframe === 3 ? "default" : "ghost"}
            size="sm"
            onClick={() => setTimeframe(3)}
            className="text-xs px-3"
          >
            3M
          </Button>
          <Button
            variant={timeframe === 6 ? "default" : "ghost"}
            size="sm"
            onClick={() => setTimeframe(6)}
            className="text-xs px-3"
          >
            6M
          </Button>
          <Button
            variant={timeframe === 12 ? "default" : "ghost"}
            size="sm"
            onClick={() => setTimeframe(12)}
            className="text-xs px-3"
          >
            12M
          </Button>
        </div>
      </div>

      {/* Account Tabs Bar */}
      <div className="flex overflow-x-auto space-x-2 mb-6 pb-2">
        <div
          onClick={() => setActiveTab('all')}
          className={`flex flex-col items-center cursor-pointer p-2 ${activeTab === 'all' ? '' : 'opacity-70'}`}
        >
          <div className="w-12 h-12 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full mb-1">
            <ListIcon className="w-6 h-6" />
          </div>
          <span className="text-xs">All</span>
          {activeTab === 'all' && <div className="w-1 h-1 rounded-full bg-blue-500 mt-1" />}
        </div>

        <div
          onClick={handleAddAccount}
          className="flex flex-col items-center cursor-pointer p-2 opacity-70"
        >
          <div className="w-12 h-12 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full mb-1">
            <Plus className="w-6 h-6" />
          </div>
          <span className="text-xs">Add</span>
        </div>

        {profiles.map(profile => (
          <div
            key={profile.user.username}
            onClick={() => setActiveTab(profile.user.username)}
            className={`flex flex-col items-center cursor-pointer p-2 ${activeTab === profile.user.username ? '' : 'opacity-70'}`}
          >
            <div className="relative w-12 h-12 mb-1">
              <img
                src={profile.user.avatar || '/placeholder-avatar.jpg'}
                alt={profile.user.username}
                className="w-12 h-12 rounded-full object-cover"
              />
              {profile.user.username === 'billaiapp' && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-gray-900"></div>
              )}
            </div>
            <span className="text-xs truncate max-w-[64px]">{profile.user.username}</span>
            {activeTab === profile.user.username && <div className="w-1 h-1 rounded-full bg-blue-500 mt-1" />}
          </div>
        ))}
      </div>

      <div>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : profiles.length > 0 ? (
          <div>
            {activeTab === 'all' ? (
              <AllAccountsView
                profiles={profiles}
                setActiveTab={setActiveTab}
                formatNumber={formatNumber}
                getAverageViews={getAverageViews}
                calculateEngagementRate={calculateEngagementRate}
                getPostFrequency={getPostFrequency}
                handleAddAccount={handleAddAccount}
              />
            ) : activeProfile ? (
              <AccountAnalyticsView
                activeProfile={activeProfile}
                setActiveTab={setActiveTab}
                timeframe={timeframe}
                setTimeframe={setTimeframe}
                formatNumber={formatNumber}
                isRefreshing={refreshing}
                getContributionData={getContributionData}
                getContributionColor={getContributionColor}
                getTimeframeMonthLabels={getTimeframeMonthLabels}
              />
            ) : (
              <div className="text-center py-12">
                <h2 className="text-xl font-semibold mb-4">Profile not found</h2>
                <Button onClick={() => setActiveTab('all')} className="rounded-xl">Back to All Profiles</Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-4">No profiles found</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Add a TikTok profile to get started with analytics and insights
            </p>
            <Button onClick={handleAddAccount} className="rounded-xl">Add TikTok Profile</Button>
          </div>
        )}
      </div>

      <AddAccountDialog
        open={addAccountDialogOpen}
        onOpenChange={setAddAccountDialogOpen}
        onSuccess={handleAddAccountSuccess}
      />
    </div>
  )
}

