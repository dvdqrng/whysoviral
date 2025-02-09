"use client"

import { useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, PlusCircle, List, ListChecks, LineChart as LineChartIcon, BarChart as BarChartIcon } from "lucide-react"
import { calculateUserAnalytics } from '@/lib/analytics-service'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'

export default function TikTokUserStats() {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profiles, setProfiles] = useState<{ [key: string]: any }>({})
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'add' | string>('add')
  const [analytics, setAnalytics] = useState<{ [key: string]: any }>({})

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

      const userData = await userResponse.json()
      if (!userResponse.ok) {
        throw new Error(userData.error || 'Failed to fetch user data')
      }

      const postsResponse = await fetch('/api/tiktok/user/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileUrl: input,
          count: 10,
          cursor: '0'
        }),
      })

      if (!postsResponse.ok) {
        const errorData = await postsResponse.json()
        throw new Error(errorData.error || 'Failed to fetch posts')
      }

      await new Promise(resolve => setTimeout(resolve, 1000))

      const username = userData.data.data.user.uniqueId
      const supabasePostsResponse = await fetch(`/api/tiktok/posts/${username}`)

      if (!supabasePostsResponse.ok) {
        const errorData = await supabasePostsResponse.json()
        throw new Error(errorData.error || 'Failed to fetch stored posts')
      }

      const supabasePosts = await supabasePostsResponse.json()

      setProfiles(prev => ({
        ...prev,
        [username]: {
          profileData: userData,
          postsData: { data: { data: { videos: supabasePosts.data } } }
        }
      }))

      setActiveTab(username)
      setInput('')

    } catch (error) {
      console.error('Error fetching data:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
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

  useEffect(() => {
    if (activeTab !== 'all' && activeTab !== 'add' && profiles[activeTab]) {
      const username = profiles[activeTab].profileData.data.data.user.uniqueId
      calculateUserAnalytics(username)
        .then(data => {
          setAnalytics(prev => ({
            ...prev,
            [username]: data
          }))
        })
        .catch(console.error)
    }
  }, [activeTab, profiles])

  return (
    <div className="min-h-screen">
      {/* Tabs */}
      <div>
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
              <span className={`text-xs truncate max-w-[48px] ${activeTab === username
                ? 'text-foreground'
                : 'text-muted-foreground'
                }`}>{username}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8">
        {/* Add Profile Form */}
        {activeTab === 'add' && (
          <div className="max-w-2xl">
            <form onSubmit={handleSubmit} className="flex gap-4">
              <Input
                placeholder="Enter TikTok username or user ID (e.g., @username)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                required
                className="h-10"
              />
              <Button type="submit" disabled={isLoading} className="h-10">
                {isLoading ? "Loading..." : "Add Profile"}
              </Button>
            </form>

            {error && (
              <Alert className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Profile Card */}
        {activeTab !== 'all' && activeTab !== 'add' && profiles[activeTab] && (
          <div className="max-w-4xl space-y-2">
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
                        <LineChart data={analytics[activeTab].viewsTrend}>
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
                    {analytics[activeTab]?.avgViewsPerPost
                      ? formatNumber(analytics[activeTab].avgViewsPerPost)
                      : '...'
                    }
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
                        <BarChart data={analytics[activeTab].weeklyPostFrequency} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
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
                    {analytics[activeTab]?.avgTimeBetweenPosts
                      ? `${Math.round(analytics[activeTab].avgTimeBetweenPosts)}h`
                      : '...'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Posts */}
            {profiles[activeTab].postsData?.data?.data?.videos?.length > 0 && (
              <div>
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

        {/* All Profiles Grid */}
        {activeTab === 'all' && (
          <div className="space-y-3">
            {Object.entries(profiles).map(([username, data]) => (
              <div key={username} className="p-4 rounded-lg border bg-background">
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Account info - stays as one unit */}
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <img
                      src={data.profileData.data.data.user.avatarThumb}
                      alt={username}
                      className="w-10 h-10 rounded-full flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="font-medium truncate">{data.profileData.data.data.user.nickname}</h3>
                      <p className="text-sm text-muted-foreground">@{username}</p>
                    </div>
                  </div>

                  {/* Metrics section - wraps as needed */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 gap-6 flex-1">
                    <div>
                      <p className="text-sm text-muted-foreground whitespace-nowrap">Followers</p>
                      <p className="text-lg font-semibold">
                        {formatNumber(data.profileData.data.data.stats.followerCount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground whitespace-nowrap">Following</p>
                      <p className="text-lg font-semibold">
                        {formatNumber(data.profileData.data.data.stats.followingCount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-2 whitespace-nowrap">
                        <LineChartIcon className="w-4 h-4 flex-none" />ViewsTrend
                      </p>
                      <div className="h-6">
                        {analytics[username]?.viewsTrend && (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={analytics[username].viewsTrend}>
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
                      <p className="text-sm text-muted-foreground whitespace-nowrap">Ø views p. post</p>
                      <p className="text-lg font-semibold">
                        {analytics[username]?.avgViewsPerPost
                          ? formatNumber(analytics[username].avgViewsPerPost)
                          : '...'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-2 whitespace-nowrap">
                        <BarChartIcon className="w-4 h-4 flex-none" />Post Frequency
                      </p>
                      <div className="h-6">
                        {analytics[username]?.weeklyPostFrequency && (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics[username].weeklyPostFrequency} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                              <Bar
                                dataKey="count"
                                fill="#3b82f6"
                                opacity={0.9}
                                radius={[2, 2, 0, 0]}
                                maxBarSize={4}
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
                      <p className="text-sm text-muted-foreground whitespace-nowrap">Ø time to post</p>
                      <p className="text-lg font-semibold">
                        {analytics[username]?.avgTimeBetweenPosts
                          ? `${Math.round(analytics[username].avgTimeBetweenPosts)}h`
                          : '...'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        )}
      </div>
    </div>
  )
}

