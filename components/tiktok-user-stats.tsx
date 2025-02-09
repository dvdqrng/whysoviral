"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

export default function TikTokUserStats() {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profileData, setProfileData] = useState<any>(null)
  const [postsData, setPostsData] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim()) {
      setError('Please enter a TikTok username or user ID')
      return
    }

    setIsLoading(true)
    setError(null)
    console.log('Fetching data for input:', input)

    try {
      // Fetch user info
      console.log('Making user info request to:', '/api/tiktok/user')
      const userResponse = await fetch('/api/tiktok/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profileUrl: input }),
      })

      console.log('User response status:', userResponse.status)
      const responseText = await userResponse.text()
      console.log('Raw response:', responseText)

      let userData
      try {
        userData = JSON.parse(responseText)
        console.log('Parsed user data:', userData)
      } catch (parseError) {
        console.error('Failed to parse user response:', parseError)
        throw new Error('Invalid response format from server')
      }

      if (!userResponse.ok) {
        throw new Error(userData.error || 'Failed to fetch user data')
      }

      console.log('User data structure:', {
        hasData: !!userData.data,
        hasUser: !!userData.data?.data?.user,
        hasStats: !!userData.data?.data?.user?.stats,
        userFields: userData.data?.data?.user ? Object.keys(userData.data.data.user) : [],
        statsFields: userData.data?.data?.user?.stats ? Object.keys(userData.data.data.user.stats) : []
      })

      setProfileData(userData)

      // Fetch posts
      console.log('Making posts request to:', '/api/tiktok/user/posts')
      const postsResponse = await fetch('/api/tiktok/user/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

      // Wait a moment for the posts to be stored in Supabase
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Fetch the stored posts from Supabase
      const username = userData.data.data.user.uniqueId
      const supabasePostsResponse = await fetch(`/api/tiktok/posts/${username}`)

      if (!supabasePostsResponse.ok) {
        const errorData = await supabasePostsResponse.json()
        throw new Error(errorData.error || 'Failed to fetch stored posts')
      }

      const supabasePosts = await supabasePostsResponse.json()
      setPostsData({ data: { data: { videos: supabasePosts.data } } })

    } catch (error) {
      console.error('Error fetching data:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
      setProfileData(null)
      setPostsData(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Add debug logging for render conditions
  console.log('Render state:', {
    isLoading,
    hasError: !!error,
    hasProfileData: !!profileData?.data?.data?.user,
    profileDataStructure: profileData ? {
      hasData: !!profileData.data?.data,
      hasUser: !!profileData.data?.data?.user,
      hasStats: !!profileData.data?.data?.stats
    } : null,
    hasPostsData: !!postsData?.data?.data?.videos?.length,
    postsDataStructure: postsData ? {
      hasVideos: !!postsData.data?.data?.videos,
      videosLength: postsData.data?.data?.videos?.length
    } : null
  })

  const formatNumber = (num: number) => {
    if (!num) return '0'
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const formatDate = (date: string | number) => {
    if (!date) return 'Unknown date'
    const dateObj = typeof date === 'number' ? new Date(date * 1000) : new Date(date)
    return dateObj.toLocaleDateString()
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold">TikTok Profile Analytics</h1>
        <form onSubmit={handleSubmit} className="flex gap-4">
          <Input
            placeholder="Enter TikTok username or user ID (e.g., @username or 107955)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="max-w-md"
            required
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Loading..." : "Fetch Stats"}
          </Button>
        </form>

        {error && (
          <Alert className="border-red-400">
            <AlertDescription className="text-red-600">
              {error}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      )}

      {!isLoading && profileData?.data?.data?.user && (
        <>
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start gap-4">
                {profileData.data.data.user.avatarThumb && (
                  <img
                    src={profileData.data.data.user.avatarThumb}
                    alt={profileData.data.data.user.nickname}
                    className="w-24 h-24 rounded-full"
                  />
                )}
                <div>
                  <CardTitle className="text-2xl">{profileData.data.data.user.nickname}</CardTitle>
                  <p className="text-muted-foreground">@{profileData.data.data.user.uniqueId}</p>
                  {profileData.data.data.user.signature && (
                    <p className="mt-2">{profileData.data.data.user.signature}</p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{formatNumber(profileData.data.data.stats.followerCount)}</p>
                  <p className="text-muted-foreground">Followers</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatNumber(profileData.data.data.stats.followingCount)}</p>
                  <p className="text-muted-foreground">Following</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatNumber(profileData.data.data.stats.heart)}</p>
                  <p className="text-muted-foreground">Likes</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatNumber(profileData.data.data.stats.videoCount)}</p>
                  <p className="text-muted-foreground">Videos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Posts */}
          {postsData?.data?.data?.videos?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Posts</CardTitle>
                <CardDescription>Latest {postsData.data.data.videos.length} TikTok videos and their performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {postsData.data.data.videos.map((post: any) => (
                    <div key={post.id} className="flex gap-4 p-4 border rounded-lg">
                      {post.video_cover_url && (
                        <img
                          src={post.video_cover_url}
                          alt={post.description || 'Video thumbnail'}
                          className="w-32 h-32 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium line-clamp-2">{post.description || 'No description'}</p>
                        <p className="text-sm text-muted-foreground mb-2">
                          Posted on {formatDate(post.created_at)}
                        </p>
                        <div className="grid grid-cols-4 gap-4">
                          <div>
                            <p className="font-bold">{formatNumber(post.plays || 0)}</p>
                            <p className="text-sm text-muted-foreground">Views</p>
                          </div>
                          <div>
                            <p className="font-bold">{formatNumber(post.likes || 0)}</p>
                            <p className="text-sm text-muted-foreground">Likes</p>
                          </div>
                          <div>
                            <p className="font-bold">{formatNumber(post.comments || 0)}</p>
                            <p className="text-sm text-muted-foreground">Comments</p>
                          </div>
                          <div>
                            <p className="font-bold">{formatNumber(post.shares || 0)}</p>
                            <p className="text-sm text-muted-foreground">Shares</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

