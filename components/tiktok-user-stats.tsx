"use client"

import { useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, PlusCircle, List, ListChecks, LineChart as LineChartIcon, BarChart as BarChartIcon, Loader2 } from "lucide-react"
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
  const [isInitialLoading, setIsInitialLoading] = useState(true)

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
        const transformedProfiles = data.data.reduce((acc: any, profile: any) => {
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
                  videos: posts
                }
              }
            }
          }
          return acc
        }, {})

        console.log('Loaded profiles:', Object.keys(transformedProfiles))
        setProfiles(transformedProfiles)

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

      const username = userData.data.data.user.uniqueId

      // Check if we already have this profile
      const existingProfile = profiles[username]
      console.log('Profile status:', {
        username,
        isExisting: !!existingProfile,
        existingAnalytics: existingProfile ? !!existingProfile.analytics : false
      })

      // Try to fetch fresh data from TikTok API
      try {
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
          console.warn('Failed to fetch fresh posts from TikTok API')
        }
      } catch (error) {
        console.warn('Error fetching fresh posts:', error)
      }

      // Always fetch stored data from Supabase
      const supabasePostsResponse = await fetch(`/api/tiktok/posts/${username}`)

      if (!supabasePostsResponse.ok) {
        const errorData = await supabasePostsResponse.json()
        throw new Error(errorData.error || 'Failed to fetch stored posts')
      }

      const supabasePosts = await supabasePostsResponse.json()

      // Update profiles state, preserving existing analytics and other data
      setProfiles(prev => {
        const updatedProfile = {
          ...prev,
          [username]: {
            ...existingProfile, // Preserve any existing data
            profileData: userData,
            postsData: { data: { data: { videos: supabasePosts.data } } }
          }
        }
        console.log('Profile update:', {
          username,
          preservedDataKeys: existingProfile ? Object.keys(existingProfile) : [],
          newDataKeys: Object.keys(updatedProfile[username])
        })
        return updatedProfile
      })

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
      <div className="px-4 sm:px-6 py-8">
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
              <div className="max-w-2xl">
                <form onSubmit={handleSubmit} className="flex gap-4">
                  <Input
                    placeholder="Enter TikTok username or user ID (e.g., @username)"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    required
                    className="h-10"
                    disabled={isLoading}
                  />
                  <Button type="submit" disabled={isLoading} className="h-10">
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

            {/* All Profiles View */}
            {activeTab === 'all' && (
              <div className="space-y-2 w-full">
                {Object.entries(profiles).length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No profiles added yet. Click the "+" button to add a TikTok profile.
                  </div>
                ) : (
                  Object.entries(profiles).map(([username, data]) => (
                    <div key={username} className="p-4 rounded-lg border bg-background">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        {/* Account info */}
                        <div className="flex items-center gap-4 min-w-[200px]">
                          <img
                            src={data.profileData.data.data.user.avatarThumb}
                            alt={username}
                            className="w-12 h-12 rounded-full flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <h3 className="text-base font-medium truncate">{data.profileData.data.data.user.nickname}</h3>
                            <p className="text-sm text-muted-foreground">@{username}</p>
                          </div>
                        </div>

                        {/* Metrics section */}
                        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 items-center">
                          <div>
                            <p className="text-sm text-muted-foreground whitespace-nowrap">Followers</p>
                            <p className="text-base font-semibold">
                              {formatNumber(data.profileData.data.data.stats.followerCount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground whitespace-nowrap">Following</p>
                            <p className="text-base font-semibold">
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
                            <p className="text-base font-semibold">
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
                            <p className="text-base font-semibold">
                              {analytics[username]?.avgTimeBetweenPosts
                                ? `${Math.round(analytics[username].avgTimeBetweenPosts)}h`
                                : '...'
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Profile Card */}
            {activeTab !== 'all' && activeTab !== 'add' && profiles[activeTab] && (
              <div className="max-w-full space-y-2">
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
          </>
        )}
      </div>
    </div>
  )
}

